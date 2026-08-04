import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { TRANSLATIONS } from '@/data/translations';
import { CHAPTER_SUMMARIES } from '@/data/chapter-summaries';
import { BibleBook, Rarity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from './SettingsContext';
import {
  MIN_CHAPTERS_ENABLED_FOR_SCORE,
  countEnabledChaptersForScore,
} from '../utils/scoreGate';

/** Keep the historical open path so existing installs resolve the same DB file. */
function getUserDatabaseName(userId: string): string {
  const documentDirectory = (FileSystem as { documentDirectory?: string | null }).documentDirectory;
  if (documentDirectory) {
    return `${documentDirectory}SQLite/BibleBooks_${userId}.db`;
  }
  return `BibleBooks_${userId}.db`;
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

  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);
  const openedUserIdRef = useRef<string | null>(null);
  const readyPromiseRef = useRef<Promise<SQLite.SQLiteDatabase> | null>(null);
  const writeChainRef = useRef<Promise<unknown>>(Promise.resolve());

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

  /** Serialize DB writes so concurrent toggles can't hit a half-closed native handle. */
  const enqueueWrite = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = writeChainRef.current.then(task, task);
    writeChainRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }, []);

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

  /**
   * Open once per user. Re-opening the same DB (especially with absolute paths)
   * causes intermittent Android NativeDatabase.prepareAsync NPEs when an older
   * shared handle is GC'd/closed underneath an in-flight toggle.
   */
  const ensureDatabase = useCallback(async (userId: string): Promise<SQLite.SQLiteDatabase> => {
    if (dbRef.current && openedUserIdRef.current === userId && readyPromiseRef.current) {
      return readyPromiseRef.current;
    }

    if (readyPromiseRef.current && openedUserIdRef.current === userId) {
      return readyPromiseRef.current;
    }

    openedUserIdRef.current = userId;
    const initPromise = (async () => {
      // Open once per user. Re-opening (effect churn / rapid toggles) is what
      // triggers intermittent Android NativeDatabase.prepareAsync NPEs.
      const db = await SQLite.openDatabaseAsync(getUserDatabaseName(userId));
      dbRef.current = db;
      await setupSchemaAndSeed(db);
      await refreshEnrichedBooks(db);
      return db;
    })();

    readyPromiseRef.current = initPromise;

    try {
      return await initPromise;
    } catch (err) {
      // Allow a future retry after a failed open/init.
      if (openedUserIdRef.current === userId) {
        readyPromiseRef.current = null;
        dbRef.current = null;
        openedUserIdRef.current = null;
      }
      throw err;
    }
  }, [setupSchemaAndSeed, refreshEnrichedBooks]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!user?.id) {
        dbRef.current = null;
        openedUserIdRef.current = null;
        readyPromiseRef.current = null;
        setBibleBooks([]);
        setIsLoading(false);
        return;
      }

      // Already ready for this user — avoid loading flicker on callback identity changes.
      if (openedUserIdRef.current === user.id && dbRef.current && readyPromiseRef.current) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await ensureDatabase(user.id);
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
  }, [user?.id, ensureDatabase]);

  useEffect(() => {
    if (!dbRef.current || !readyPromiseRef.current) return;
    if (openedUserIdRef.current !== user?.id) return;

    void (async () => {
      try {
        const db = await readyPromiseRef.current!;
        await refreshEnrichedBooks(db);
      } catch (err) {
        console.error('Failed to re-enrich books:', err);
      }
    })();
  }, [translation, refreshEnrichedBooks, user?.id]);

  const refreshBooks = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // Force a fresh load through the existing connection (do not reopen).
      const db = await ensureDatabase(user.id);
      await setupSchemaAndSeed(db);
      await refreshEnrichedBooks(db);
      setError(null);
    } catch (err) {
      console.error('Refresh failed:', err);
      setError('Failed to refresh books');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, ensureDatabase, setupSchemaAndSeed, refreshEnrichedBooks]);

  const toggleBookEnabled = useCallback(async (bookName: string) => {
    if (!user?.id) return;

    try {
      await enqueueWrite(async () => {
        const db = await ensureDatabase(user.id);
        await db.runAsync(
          'UPDATE BibleBooks SET Enabled = NOT Enabled WHERE Book = ?;',
          [bookName],
        );
        setBibleBooks(prevBooks =>
          prevBooks.map(book =>
            book.bookName === bookName
              ? { ...book, enabled: !book.enabled }
              : book,
          ),
        );
      });
    } catch (err) {
      console.error('Toggle failed:', err);
      setError(`Toggle failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [user?.id, ensureDatabase, enqueueWrite]);

  const updateBookEnabledStatus = useCallback(async (bookName: string) => {
    if (!user?.id) return;

    try {
      await enqueueWrite(async () => {
        const db = await ensureDatabase(user.id);
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

          await Promise.all(
            chapters.map(chapter =>
              db.runAsync(
                'UPDATE ChapterRarities SET Rarity = ? WHERE Book = ? AND Chapter = ?;',
                ['common', bookName, chapter.Chapter],
              ),
            ),
          );

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
  }, [user?.id, ensureDatabase, enqueueWrite]);

  const updateChapterRarity = useCallback(async (
    bookName: string,
    chapterNum: number,
    rarity: Rarity,
    shouldUpdateBook = true,
  ) => {
    if (!user?.id) return;

    try {
      await enqueueWrite(async () => {
        const db = await ensureDatabase(user.id);
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
  }, [user?.id, ensureDatabase, enqueueWrite, updateBookEnabledStatus]);

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
