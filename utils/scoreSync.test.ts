import {
  createOverallScoreSync,
  createSerialQueue,
  parseStoredScore,
  reconcileOverallScore,
} from './scoreSync';
import type { ScoreServer, ScoreStorage } from './scoreSync';

describe('parseStoredScore', () => {
  it('treats missing and invalid values as 0', () => {
    expect(parseStoredScore(null)).toBe(0);
    expect(parseStoredScore('')).toBe(0);
    expect(parseStoredScore('nope')).toBe(0);
  });

  it('parses integer strings', () => {
    expect(parseStoredScore('11995')).toBe(11995);
    expect(parseStoredScore('12000')).toBe(12000);
  });
});

describe('reconcileOverallScore', () => {
  it('keeps the local score and uploads when local is ahead of the server', () => {
    expect(reconcileOverallScore(12000, 11995)).toEqual({
      score: 12000,
      shouldUpload: true,
    });
  });

  it('takes the server score when the server is ahead', () => {
    expect(reconcileOverallScore(11995, 12000)).toEqual({
      score: 12000,
      shouldUpload: false,
    });
  });

  it('does not upload when scores already match', () => {
    expect(reconcileOverallScore(12000, 12000)).toEqual({
      score: 12000,
      shouldUpload: false,
    });
  });

  it('does not treat a stale React 0 as the local score', () => {
    expect(reconcileOverallScore(0, 11995)).toEqual({
      score: 11995,
      shouldUpload: false,
    });
  });
});

describe('createSerialQueue', () => {
  it('runs tasks one at a time in order', async () => {
    const enqueue = createSerialQueue();
    const events: string[] = [];

    const delayed = (label: string, ms: number) =>
      enqueue(async () => {
        events.push(`start ${label}`);
        await new Promise((resolve) => setTimeout(resolve, ms));
        events.push(`end ${label}`);
        return label;
      });

    const results = await Promise.all([
      delayed('a', 30),
      delayed('b', 5),
      delayed('c', 5),
    ]);

    expect(results).toEqual(['a', 'b', 'c']);
    expect(events).toEqual([
      'start a',
      'end a',
      'start b',
      'end b',
      'start c',
      'end c',
    ]);
  });

  it('continues after a rejected task', async () => {
    const enqueue = createSerialQueue();
    const first = enqueue(async () => {
      throw new Error('boom');
    });
    const second = enqueue(async () => 'ok');

    await expect(first).rejects.toThrow('boom');
    await expect(second).resolves.toBe('ok');
  });
});

function memoryStorage(initial: Record<string, string> = {}): ScoreStorage {
  const data = { ...initial };
  return {
    async getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    async setItem(key, value) {
      data[key] = value;
    },
  };
}

describe('createOverallScoreSync', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads storage then uploads when the server is behind (restart after a missed RPC)', async () => {
    const storage = memoryStorage({ user1_overallScore: '12000' });
    let serverScore = 11995;
    let uploaded: number | null = null;

    const server: ScoreServer = {
      getOverallScoreFromServer: async () => ({ overallScore: serverScore }),
      incrementUserScoreRpc: async () => {},
      updateOverallScoreOnServer: async (score) => {
        uploaded = score;
        serverScore = score;
      },
    };

    let displayed = 0;
    const sync = createOverallScoreSync({
      getUserId: () => 'user1',
      storage,
      getServer: () => server,
      onChange: (score) => {
        displayed = score;
      },
    });

    await sync.loadFromStorage();
    expect(displayed).toBe(12000);

    await sync.sync();

    expect(displayed).toBe(12000);
    expect(uploaded).toBe(12000);
    expect(serverScore).toBe(12000);
    expect(await storage.getItem('user1_overallScore')).toBe('12000');
  });

  it('does not clobber a stored 12000 with server 11995 by reconciling against 0', async () => {
    const storage = memoryStorage({ user1_overallScore: '12000' });
    const server: ScoreServer = {
      getOverallScoreFromServer: async () => ({ overallScore: 11995 }),
      incrementUserScoreRpc: async () => {},
      updateOverallScoreOnServer: async () => {},
    };

    const scores: number[] = [];
    const sync = createOverallScoreSync({
      getUserId: () => 'user1',
      storage,
      getServer: () => server,
      onChange: (score) => {
        scores.push(score);
      },
    });

    await sync.loadFromStorage();
    await sync.sync();

    expect(sync.getScore()).toBe(12000);
    expect(scores.at(-1)).toBe(12000);
    expect(await storage.getItem('user1_overallScore')).toBe('12000');
  });

  it('applies overlapping increments from the live score, not a stale closure', async () => {
    const storage = memoryStorage({ user1_overallScore: '11995' });
    let serverScore = 11995;
    const rpcCalls: number[] = [];

    const server: ScoreServer = {
      getOverallScoreFromServer: async () => ({ overallScore: serverScore }),
      incrementUserScoreRpc: async (points) => {
        await new Promise((resolve) => setTimeout(resolve, 15));
        rpcCalls.push(points);
        serverScore += points;
      },
      updateOverallScoreOnServer: async (score) => {
        serverScore = score;
      },
    };

    let displayed = 0;
    const sync = createOverallScoreSync({
      getUserId: () => 'user1',
      storage,
      getServer: () => server,
      onChange: (score) => {
        displayed = score;
      },
    });

    await sync.loadFromStorage();

    await Promise.all([sync.increment(5), sync.increment(5)]);

    expect(displayed).toBe(12005);
    expect(rpcCalls).toEqual([5, 5]);
    expect(serverScore).toBe(12005);
    expect(await storage.getItem('user1_overallScore')).toBe('12005');
  });

  it('keeps the local +5 and uploads it when the increment RPC fails, then syncs', async () => {
    const storage = memoryStorage({ user1_overallScore: '11995' });
    let serverScore = 11995;

    const server: ScoreServer = {
      getOverallScoreFromServer: async () => ({ overallScore: serverScore }),
      incrementUserScoreRpc: async () => {
        throw new Error('network down');
      },
      updateOverallScoreOnServer: async (score) => {
        serverScore = score;
      },
    };

    let displayed = 0;
    const sync = createOverallScoreSync({
      getUserId: () => 'user1',
      storage,
      getServer: () => server,
      onChange: (score) => {
        displayed = score;
      },
    });

    await sync.loadFromStorage();
    await sync.increment(5);

    expect(displayed).toBe(12000);
    expect(serverScore).toBe(12000);
    expect(await storage.getItem('user1_overallScore')).toBe('12000');
  });

  it('skips zero-point increments', async () => {
    const incrementUserScoreRpc = jest.fn<(points: number) => Promise<void>>();
    const storage = memoryStorage({ user1_overallScore: '10' });
    const sync = createOverallScoreSync({
      getUserId: () => 'user1',
      storage,
      getServer: () => ({
        getOverallScoreFromServer: async () => ({ overallScore: 10 }),
        incrementUserScoreRpc,
        updateOverallScoreOnServer: async () => {},
      }),
      onChange: () => {},
    });

    await sync.loadFromStorage();
    await sync.increment(0);

    expect(sync.getScore()).toBe(10);
    expect(incrementUserScoreRpc).not.toHaveBeenCalled();
  });
});
