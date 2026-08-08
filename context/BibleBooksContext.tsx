import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import * as SQLite from 'expo-sqlite';
import { TRANSLATIONS } from '@/data/translations';
import { CHAPTER_SUMMARIES } from '@/data/chapter-summaries';
import { BibleBook, Rarity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from './SettingsContext';
import {
  MIN_CHAPTERS_ENABLED_FOR_SCORE,
  countEnabledChaptersForScore,
} from '../utils/scoreGate';

/**
 * Use the bare DB filename. expo-sqlite stores this under the app's SQLite directory,
 * which matches the historical `{documentDirectory}SQLite/BibleBooks_*.db` path.
 * Absolute `file://` paths have caused intermittent Android prepareAsync NPEs.
 */
function getUserDatabaseName(userId: string): string {
  return `BibleBooks_${userId}.db`;
}

function isNativePrepareFailure(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('prepareAsync') || message.includes('NullPointerException');
}

/**
 * Module-level connection cache so React remounts / Fast Refresh do not reopen the
 * same file under a new SharedObject (which can GC-close the native handle on Android).
 */
type DbConnection = {
  userId: string;
  ready: Promise<SQLite.SQLiteDatabase>;
};

let connection: DbConnection | null = null;
let opChain: Promise<unknown> = Promise.resolve();
/** >0 while a queued op is running; nested withDatabase calls run inline. */
let opDepth = 0;

/** Serialize every DB read/write onto one chain. */
function enqueueDbOp<T>(task: () => Promise<T>): Promise<T> {
  if (opDepth > 0) {
    return task();
  }

  const run = async () => {
    opDepth += 1;
    try {
      return await task();
    } finally {
      opDepth -= 1;
    }
  };

  const next = opChain.then(run, run);
  opChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function closeConnection(): Promise<void> {
  const current = connection;
  connection = null;
  if (!current) return;
  try {
    const db = await current.ready;
    await db.closeAsync();
  } catch {
    // Ignore close errors — the native handle may already be gone.
  }
}

async function openConnection(userId: string): Promise<SQLite.SQLiteDatabase> {
  if (connection?.userId === userId) {
    return connection.ready;
  }

  if (connection) {
    await closeConnection();
  }

  const ready = SQLite.openDatabaseAsync(getUserDatabaseName(userId), {
    // Dedicated connection for this singleton; avoids sharing a stale cached handle.
    useNewConnection: true,
  });

  connection = { userId, ready };
  try {
    return await ready;
  } catch (err) {
    if (connection?.userId === userId) {
      connection = null;
    }
    throw err;
  }
}

async function withDatabase<T>(
  userId: string,
  task: (db: SQLite.SQLiteDatabase) => Promise<T>,
): Promise<T> {
  return enqueueDbOp(async () => {
    const run = async () => {
      const db = await openConnection(userId);
      return task(db);
    };

    try {
      return await run();
    } catch (err) {
      // Android can briefly hand back a dead native handle; reopen once and retry.
      if (!isNativePrepareFailure(err)) throw err;
      await closeConnection();
      return run();
    }
  });
}

export { MIN_CHAPTERS_ENABLED_FOR_SCORE } from '../utils/scoreGate';

interface BibleBooksContextType {
  bibleBooks: BibleBook[];
  toggleBookEnabled: (bookName: string) => Promise<void>;
  updateChapterRarity: (bookName: string, chapter: number, rarity: Rarity, shouldUpdateBook?: boolean) => Promise<void>;
  updateBookEnabledStatus: (bookName: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshBooks: () => Promise<void>;
  enabledChapterCount: number;
  scoreEnabledFlag: boolean;
  setScoreEnabledFlag: (status: boolean) => void;
}

const BibleBooksContext = createContext<BibleBooksContextType>({
  bibleBooks: [],
  toggleBookEnabled: async () => {},
  updateChapterRarity: async () => {},
  updateBookEnabledStatus: async () => {},
  isLoading: true,
  error: null,
  refreshBooks: async () => {},
  enabledChapterCount: 0,
  scoreEnabledFlag: false,
  setScoreEnabledFlag: () => {},
});

function enrichBooks(
  loadedBooks: { bookName: string; enabled: boolean }[],
  rarityResults: { bookName: string; chapter: number; rarity: Rarity }[],
  translationKey: keyof typeof TRANSLATIONS,
): BibleBook[] {
  const translationData = TRANSLATIONS[translationKey];
  return loadedBooks.map(book => {
    const tBook = translationData.Bible.find(b => b.Book === book.bookName);
    const chapters = tBook?.Chapters.map(ch => {
      const match = rarityResults.find(r => r.bookName === book.bookName && r.chapter === ch.Chapter);
      return {
        chapter: ch.Chapter,
        verses: ch.Verses.map(v => ({
          verseNumber: v.VerseNumber,
          text: v.Text,
          duplicateLocations: v.duplicateLocations ?? [],
        })),
        summary: ch.Summary ?? CHAPTER_SUMMARIES[book.bookName]?.[ch.Chapter] ?? null,
        rarity: match?.rarity ?? 'common',
      };
    }) ?? [];
    return { ...book, chapters };
  });
}

export const BibleBooksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /** Latest desired enabled flag per book; rapid taps coalesce into one write. */
  const desiredEnabledRef = useRef<Map<string, boolean>>(new Map());
  const persistInFlightRef = useRef<Set<string>>(new Set());

  const enabledChapterCount = countEnabledChaptersForScore(bibleBooks);
  const [scoreEnabledFlag, setScoreEnabledFlag] = useState<boolean>(
    enabledChapterCount >= MIN_CHAPTERS_ENABLED_FOR_SCORE,
  );

  const { user } = useAuth();
  const { translation } = useSettings();
  const translationRef = useRef(translation);
  useEffect(() => {
    translationRef.current = translation;
  }, [translation]);

  const loadBooksFromDB = useCallback(async (db: SQLite.SQLiteDatabase) => {
    const results = await db.getAllAsync<{ Book: string; Enabled: number }>(
      'SELECT * FROM BibleBooks;',
    );
    return results.map(book => ({
      bookName: book.Book,
      enabled: book.Enabled === 1,
    }));
  }, []);

  const loadRaritiesFromDB = useCallback(async (db: SQLite.SQLiteDatabase) => {
    return db.getAllAsync<{ bookName: string; chapter: number; rarity: Rarity }>(
      'SELECT Book as bookName, Chapter as chapter, Rarity as rarity FROM ChapterRarities',
    );
  }, []);

  const setupSchemaAndSeed = useCallback(async (db: SQLite.SQLiteDatabase) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS BibleBooks (
        Book TEXT PRIMARY KEY NOT NULL,
        Enabled INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT DEFAULT '${new Date().toISOString()}'
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ChapterRarities (
        Book TEXT NOT NULL,
        Chapter INTEGER NOT NULL,
        Rarity TEXT NOT NULL DEFAULT 'common',
        updated_at TEXT DEFAULT '${new Date().toISOString()}',
        PRIMARY KEY (Book, Chapter)
      );
    `);

    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info('BibleBooks');",
    );
    const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
    // Removable in 0.5.0-beta+ (users from 0.3.0-beta or earlier can reinstall)
    if (!hasUpdatedAt) {
      await db.execAsync(`
        ALTER TABLE BibleBooks ADD COLUMN updated_at TEXT DEFAULT '${new Date().toISOString()}';
        ALTER TABLE ChapterRarities ADD COLUMN updated_at TEXT DEFAULT '${new Date().toISOString()}';
      `);
    }

    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM BibleBooks;',
    );

    if (!countResult || countResult.count === 0) {
      await db.withTransactionAsync(async () => {
        for (const book of TRANSLATIONS[translationRef.current].Bible) {
          const isGenesis = book.Book === 'Genesis';
          await db.runAsync(
            'INSERT OR IGNORE INTO BibleBooks (Book, Enabled) VALUES (?, ?);',
            [book.Book, isGenesis ? 1 : 0],
          );
        }
      });
    }
  }, []);

  const refreshEnrichedBooks = useCallback(async (db: SQLite.SQLiteDatabase) => {
    const loadedBooks = await loadBooksFromDB(db);
    const rarityResults = await loadRaritiesFromDB(db);
    setBibleBooks(enrichBooks(loadedBooks, rarityResults, translationRef.current));
  }, [loadBooksFromDB, loadRaritiesFromDB]);

  const initializeForUser = useCallback(async (userId: string) => {
    await withDatabase(userId, async (db) => {
      await setupSchemaAndSeed(db);
      await refreshEnrichedBooks(db);
    });
  }, [setupSchemaAndSeed, refreshEnrichedBooks]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!user?.id) {
        desiredEnabledRef.current.clear();
        persistInFlightRef.current.clear();
        await enqueueDbOp(async () => {
          await closeConnection();
        });
        if (!cancelled) {
          setBibleBooks([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await initializeForUser(user.id);
        if (!cancelled) {
          setError(null);
        }
      } catch (err) {
        console.error('Database initialization failed:', err);
        if (!cancelled) {
          setError('Database error. Using default books.');
          setBibleBooks(
            TRANSLATIONS[translationRef.current].Bible.map(book => ({
              bookName: book.Book,
              enabled: false,
            })),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [user?.id, initializeForUser]);

  useEffect(() => {
    if (!user?.id || !connection || connection.userId !== user.id) return;

    void (async () => {
      try {
        await withDatabase(user.id, async (db) => {
          await refreshEnrichedBooks(db);
        });
      } catch (err) {
        console.error('Failed to re-enrich books:', err);
      }
    })();
  }, [translation, refreshEnrichedBooks, user?.id]);

  const refreshBooks = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      await initializeForUser(user.id);
      setError(null);
    } catch (err) {
      console.error('Refresh failed:', err);
      setError('Failed to refresh books');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, initializeForUser]);

  const persistDesiredEnabled = useCallback(async (bookName: string, userId: string) => {
    if (persistInFlightRef.current.has(bookName)) return;
    persistInFlightRef.current.add(bookName);

    try {
      while (desiredEnabledRef.current.has(bookName)) {
        const desired = desiredEnabledRef.current.get(bookName)!;
        desiredEnabledRef.current.delete(bookName);

        await withDatabase(userId, async (db) => {
          await db.runAsync(
            'UPDATE BibleBooks SET Enabled = ? WHERE Book = ?;',
            [desired ? 1 : 0, bookName],
          );
        });
      }
    } catch (err) {
      console.error('Toggle failed:', err);
      setError(`Toggle failed: ${err instanceof Error ? err.message : String(err)}`);
      // Re-sync UI from DB so a failed write cannot leave a stale optimistic state.
      try {
        await withDatabase(userId, async (db) => {
          await refreshEnrichedBooks(db);
        });
      } catch (refreshErr) {
        console.error('Failed to recover books after toggle error:', refreshErr);
      }
    } finally {
      persistInFlightRef.current.delete(bookName);
      // A tap may have landed after the while-loop exited but before we cleared in-flight.
      if (desiredEnabledRef.current.has(bookName)) {
        void persistDesiredEnabled(bookName, userId);
      }
    }
  }, [refreshEnrichedBooks]);

  const toggleBookEnabled = useCallback(async (bookName: string) => {
    if (!user?.id) return;

    setBibleBooks(prevBooks => {
      const current = prevBooks.find(book => book.bookName === bookName);
      if (!current) return prevBooks;

      const baseline = desiredEnabledRef.current.has(bookName)
        ? desiredEnabledRef.current.get(bookName)!
        : current.enabled;
      const nextEnabled = !baseline;
      desiredEnabledRef.current.set(bookName, nextEnabled);

      return prevBooks.map(book =>
        book.bookName === bookName
          ? { ...book, enabled: nextEnabled }
          : book,
      );
    });

    await persistDesiredEnabled(bookName, user.id);
  }, [user?.id, persistDesiredEnabled]);

  const updateBookEnabledStatus = useCallback(async (bookName: string) => {
    if (!user?.id) return;

    try {
      await withDatabase(user.id, async (db) => {
        const asvBook = TRANSLATIONS[translationRef.current].Bible.find(b => b.Book === bookName);
        if (!asvBook) return;

        const totalChapters = asvBook.Chapters.map(ch => ch.Chapter);
        const chapters = await db.getAllAsync<{ Chapter: number; Rarity: Rarity }>(
          'SELECT Chapter, Rarity FROM ChapterRarities WHERE Book = ?;',
          [bookName],
        );

        const rarityMap: Record<number, Rarity> = {};
        chapters.forEach(ch => {
          rarityMap[ch.Chapter] = ch.Rarity;
        });

        const allChaptersDisabled = totalChapters.every(chNum => {
          const rarity = rarityMap[chNum] ?? 'common';
          return rarity === 'disabled';
        });

        const bookStatus = await db.getFirstAsync<{ Enabled: number }>(
          'SELECT Enabled FROM BibleBooks WHERE Book = ?;',
          [bookName],
        );

        if (allChaptersDisabled && bookStatus?.Enabled === 1) {
          await db.runAsync(
            'UPDATE BibleBooks SET Enabled = ? WHERE Book = ?;',
            [0, bookName],
          );

          for (const chapter of chapters) {
            await db.runAsync(
              'UPDATE ChapterRarities SET Rarity = ? WHERE Book = ? AND Chapter = ?;',
              ['common', bookName, chapter.Chapter],
            );
          }

          setBibleBooks(prevBooks =>
            prevBooks.map(book => {
              if (book.bookName !== bookName) return book;
              return {
                ...book,
                enabled: false,
                chapters: book.chapters?.map(ch => ({
                  ...ch,
                  rarity: 'common',
                })),
              };
            }),
          );
        }
      });
    } catch (err) {
      console.error('Failed to update book status:', err);
    }
  }, [user?.id]);

  const updateChapterRarity = useCallback(async (
    bookName: string,
    chapterNum: number,
    rarity: Rarity,
    shouldUpdateBook = true,
  ) => {
    if (!user?.id) return;

    try {
      await withDatabase(user.id, async (db) => {
        await db.runAsync(
          'INSERT OR REPLACE INTO ChapterRarities (Book, Chapter, Rarity) VALUES (?, ?, ?);',
          [bookName, chapterNum, rarity],
        );

        setBibleBooks(prevBooks =>
          prevBooks.map(book => {
            if (book.bookName !== bookName) return book;
            const updatedChapters = book.chapters?.map(ch =>
              ch.chapter === chapterNum ? { ...ch, rarity } : ch,
            ) ?? [];
            return { ...book, chapters: updatedChapters };
          }),
        );
      });

      if (shouldUpdateBook) {
        await updateBookEnabledStatus(bookName);
      }
    } catch (err) {
      console.error('Failed to update rarity:', err);
    }
  }, [user?.id, updateBookEnabledStatus]);

  const contextValue = useMemo(() => ({
    bibleBooks,
    toggleBookEnabled,
    updateChapterRarity,
    updateBookEnabledStatus,
    isLoading,
    error,
    refreshBooks,
    enabledChapterCount,
    scoreEnabledFlag,
    setScoreEnabledFlag,
  }), [
    bibleBooks,
    toggleBookEnabled,
    updateChapterRarity,
    updateBookEnabledStatus,
    isLoading,
    error,
    refreshBooks,
    enabledChapterCount,
    scoreEnabledFlag,
  ]);

  return (
    <BibleBooksContext value={contextValue}>
      {children}
    </BibleBooksContext>
  );
};

export const useBibleBooks = () => {
  const context = useContext(BibleBooksContext);
  if (!context) {
    throw new Error('useBibleBooks must be used within a BibleBooksProvider');
  }
  return context;
};
