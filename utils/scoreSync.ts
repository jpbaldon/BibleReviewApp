export interface ScoreServer {
  getOverallScoreFromServer(): Promise<{ overallScore: number }>;
  incrementUserScoreRpc(points: number): Promise<void>;
  updateOverallScoreOnServer(score: number): Promise<void>;
}

export interface ScoreStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface OverallScoreSync {
  getScore(): number;
  loadFromStorage(): Promise<void>;
  increment(points: number): Promise<void>;
  sync(): Promise<void>;
  reset(): void;
}

/**
 * Serializes async work so later tasks still run if an earlier one rejects.
 */
export function createSerialQueue(): <T>(task: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve();

  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task, task);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}

export function overallScoreStorageKey(userId: string): string {
  return `${userId}_overallScore`;
}

export function parseStoredScore(raw: string | null): number {
  if (raw == null || raw === '') {
    return 0;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : 0;
}

export function reconcileOverallScore(
  localScore: number,
  serverScore: number,
): { score: number; shouldUpload: boolean } {
  return {
    score: Math.max(localScore, serverScore),
    shouldUpload: localScore > serverScore,
  };
}

export function createOverallScoreSync(options: {
  getUserId: () => string | undefined;
  storage: ScoreStorage;
  getServer: () => ScoreServer | null;
  onChange: (score: number) => void;
}): OverallScoreSync {
  let score = 0;
  const enqueue = createSerialQueue();

  const setScore = (next: number) => {
    score = next;
    options.onChange(next);
  };

  return {
    getScore: () => score,

    reset() {
      setScore(0);
    },

    async loadFromStorage() {
      const userId = options.getUserId();
      if (!userId) {
        setScore(0);
        return;
      }

      const stored = parseStoredScore(
        await options.storage.getItem(overallScoreStorageKey(userId)),
      );
      setScore(stored);
    },

    async increment(points: number) {
      if (!Number.isFinite(points) || points === 0) {
        return;
      }

      const userId = options.getUserId();
      const next = score + points;
      setScore(next);

      await enqueue(async () => {
        if (options.getUserId() !== userId) {
          return;
        }

        if (userId) {
          await options.storage.setItem(
            overallScoreStorageKey(userId),
            String(score),
          );
        }

        const server = options.getServer();
        if (!userId || !server) {
          return;
        }

        try {
          await server.incrementUserScoreRpc(points);
        } catch (error) {
          console.error('Error incrementing overall score on server:', error);
          try {
            // Snapshot from this increment, not a later one sitting in the ref.
            await server.updateOverallScoreOnServer(next);
          } catch (fallbackError) {
            console.error(
              'Error uploading overall score after increment failure:',
              fallbackError,
            );
          }
        }
      });
    },

    async sync() {
      const userId = options.getUserId();
      if (!userId) {
        return;
      }

      await enqueue(async () => {
        const server = options.getServer();
        if (!server || options.getUserId() !== userId) {
          return;
        }

        try {
          const localScore = score;
          const { overallScore: serverScore } =
            await server.getOverallScoreFromServer();
          const { score: reconciled, shouldUpload } = reconcileOverallScore(
            localScore,
            serverScore,
          );

          if (reconciled !== localScore) {
            setScore(reconciled);
            await options.storage.setItem(
              overallScoreStorageKey(userId),
              String(reconciled),
            );
          }

          if (shouldUpload) {
            await server.updateOverallScoreOnServer(localScore);
          }
        } catch (error) {
          console.error('Error syncing scores:', error);
        }
      });
    },
  };
}
