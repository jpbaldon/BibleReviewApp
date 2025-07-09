import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { ASV } from '@/data/asv';
import { BibleBook, Rarity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useServices } from '../context/ServicesContext';

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

export const MIN_CHAPTERS_ENABLED_FOR_SCORE = 20;

export const BibleBooksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);
  const { user } = useAuth();

  const enabledChapterCount = bibleBooks.reduce((total, book) => {
    if (!book.enabled || !book.chapters) return total;
    return total + book.chapters.filter(ch => ch.rarity !== 'disabled').length;
  }, 0);

  const [scoreEnabledFlag, setScoreEnabledFlag] = useState(enabledChapterCount >= MIN_CHAPTERS_ENABLED_FOR_SCORE);

  // Initialize database asynchronously
  const openDatabase = useCallback(async () => {
    try {
      // Ensure SQLite directory exists
      if (!(await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`)).exists) {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`);
      }

      const userScopedDbName = `BibleBooks_${user?.id}.db`;

      return await SQLite.openDatabaseAsync(userScopedDbName);
    } catch (err) {
      console.error('Failed to open database:', err);
      throw err;
    }
  }, []);

  const loadBooksFromDB = useCallback(async (localdbInstance: SQLite.SQLiteDatabase) => {
    try {
      const results = await localdbInstance.getAllAsync<{Book: string, Enabled: number}>(
        'SELECT * FROM BibleBooks;'
      );
      console.log(results);
      return results.map(book => ({
        bookName: book.Book,
        enabled: book.Enabled === 1
      }));
    } catch (err) {
      console.error('Failed to load books:', err);
      throw err;
    }
  }, []);

  const initializeDatabase = useCallback(async (localdbInstance: SQLite.SQLiteDatabase) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Create table if not exists
      await localdbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS BibleBooks (
          Book TEXT PRIMARY KEY NOT NULL,
          Enabled INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT DEFAULT '${new Date().toISOString()}'
        );
      `);

      await localdbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS ChapterRarities (
        Book TEXT NOT NULL,
        Chapter INTEGER NOT NULL,
        Rarity TEXT NOT NULL DEFAULT 'common',
        updated_at TEXT DEFAULT '${new Date().toISOString()}',
        PRIMARY KEY (Book, Chapter)
        );
      `);

      const columns = await localdbInstance.getAllAsync<{name: string}>(
        "PRAGMA table_info('BibleBooks');"
      );

      const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
      //This IF can be removed in build 0.5.0-beta or later (users will just have to uninstall the app and redownload if updating from 0.3.0-beta or earlier)
      if (!hasUpdatedAt) {
        await localdbInstance.execAsync(`
          ALTER TABLE BibleBooks ADD COLUMN updated_at TEXT DEFAULT '${new Date().toISOString()}';
          ALTER TABLE ChapterRarities ADD COLUMN updated_at TEXT DEFAULT '${new Date().toISOString()}';
        `);
      }

      // 2. Check if table is empty
      const countResult = await localdbInstance.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM BibleBooks;'
      );
      
      // 3. Initialize with default books if empty
      if (!countResult || countResult.count === 0) {
        await localdbInstance.execAsync('BEGIN TRANSACTION');
        try {
          for (const book of ASV.Bible) {
            const isGenesis = book.Book === "Genesis";
            await localdbInstance.runAsync(
              'INSERT OR IGNORE INTO BibleBooks (Book, Enabled) VALUES (?, ?);',
              [book.Book, isGenesis ? 1 : 0]
            );
          }
          await localdbInstance.execAsync('COMMIT');
        } catch (txError) {
          await localdbInstance.execAsync('ROLLBACK');
          throw txError;
        }
      }

      // 4. Load books
      const loadedBooks = await loadBooksFromDB(localdbInstance);

      const rarityResults = await localdbInstance.getAllAsync<{bookName: string, chapter: number, rarity: Rarity}>(
        'SELECT Book as bookName, Chapter as chapter, Rarity as rarity FROM ChapterRarities'
      );

      const rarityMap: Record<string, Record<number, Rarity>> = {};

      rarityResults.forEach(({ bookName, chapter, rarity }) => {
        if (!rarityMap[bookName]) rarityMap[bookName] = {};
        rarityMap[bookName][chapter] = rarity;
      });

      const enrichedBooks = loadedBooks.map(book => {
        const asvBook = ASV.Bible.find(b => b.Book === book.bookName);
        const chapterWithRarity = asvBook?.Chapters.map(ch => {
          const match = rarityResults.find(r => r.bookName === book.bookName && r.chapter === ch.Chapter);
          return {
            chapter: ch.Chapter,
            verses: ch.Verses.map(v => ({
              verseNumber: v.VerseNumber,
              text: v.Text,
              duplicateLocations: v.duplicateLocations ?? [],
            })),
            summary: ch.Summary,
            rarity: match?.rarity ?? 'common',
          };
        }) ?? [];
        return {
          ...book,
          chapters: chapterWithRarity,
        };
      });

      setBibleBooks(enrichedBooks);

    } catch (err) {
      console.error('Database initialization failed:', err);
      setError('Database error. Using default books.');
      setBibleBooks(ASV.Bible.map(book => ({ bookName: book.Book, enabled: false })));
    } finally {
      setIsLoading(false);
    }
  }, [loadBooksFromDB]);



  useEffect(() => {
    let mounted = true;
    
    const initDB = async () => {
      try {
        if(!user?.id) return;
        const database = await openDatabase();
        if (mounted) {
          dbRef.current = database;
          await initializeDatabase(database);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to initialize database');
          setIsLoading(false);
        }
      }
    };

    initDB();

    return () => {
      mounted = false;
    };
  }, [openDatabase, initializeDatabase, user?.id]);

  const refreshBooks = useCallback(async () => {
    if (!dbRef.current) return;

    try {
      setIsLoading(true);
      await initializeDatabase(dbRef.current); // Reuse the full loading logic
      setError(null);
    } catch (err) {
      console.error('Refresh failed:', err);
      setError('Failed to refresh books');
    } finally {
      setIsLoading(false);
    }
  }, [dbRef.current, initializeDatabase]);

  const toggleBookEnabled = useCallback(async (bookName: string) => {
  if (!dbRef.current) return;

  try {
    if(!dbRef.current) return;
    await dbRef.current.runAsync(
      'UPDATE BibleBooks SET Enabled = NOT Enabled WHERE Book = ?;',
      [bookName]
    );

    // Optimistically update the local state
    setBibleBooks(prevBooks =>
      prevBooks.map(book =>
        book.bookName === bookName
          ? { ...book, enabled: !book.enabled }
          : book
      )
    );
  } catch (err) {
    console.error('Toggle failed:', err);
    setError(`Toggle failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}, [dbRef.current]);

  // Automatically disables a book if no chapters in the book are enabled (prevents awkwardness on other tabs when the user is being)
  const updateBookEnabledStatus = useCallback(async (bookName: string) => {
    if (!dbRef.current) return;

    try {
      const asvBook = ASV.Bible.find(b => b.Book === bookName);
      if(!asvBook) return;

      const totalChapters = asvBook.Chapters.map(ch => ch.Chapter);

      const chapters = await dbRef.current.getAllAsync<{Chapter: number, Rarity: Rarity}>(
        'SELECT Chapter, Rarity FROM ChapterRarities WHERE Book = ?;',
        [bookName]
      );

      const rarityMap: Record<number, Rarity> = {};
        chapters.forEach(ch => {
          rarityMap[ch.Chapter] = ch.Rarity;
        });

      const allChaptersDisabled = totalChapters.every(chNum => {
        const rarity = rarityMap[chNum] ?? 'common';
        return rarity === 'disabled';
      });


      // 2. Get the book's current enabled status
      const bookStatus = await dbRef.current.getFirstAsync<{Enabled: number}>(
        'SELECT Enabled FROM BibleBooks WHERE Book = ?;',
        [bookName]
      );

      if (allChaptersDisabled && bookStatus?.Enabled === 1) {
        // 4. Disable the book in database
        await dbRef.current.runAsync(
          'UPDATE BibleBooks SET Enabled = ? WHERE Book = ?;',
          [0, bookName]
        );

        // 5. Reset all chapters to 'common'
        await Promise.all(
          chapters.map(chapter =>
            dbRef.current?.runAsync(
              'UPDATE ChapterRarities SET Rarity = ? WHERE Book = ? AND Chapter = ?;',
              ['common', bookName, chapter.Chapter]
            )
          )
        );

        // 6. Update local state
        setBibleBooks(prevBooks =>
          prevBooks.map(book => {
            if (book.bookName !== bookName) return book;
            return {
              ...book,
              enabled: false,
              chapters: book.chapters?.map(ch => ({
                ...ch,
                rarity: 'common'
              }))
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed to update book status:', err);
    }
  }, [dbRef.current]);

  const updateChapterRarity = useCallback(async (
    bookName: string,
    chapterNum: number,
    rarity: Rarity,
    shouldUpdateBook = true
  ) => {
    if (!dbRef.current) return;

    try {
      // Update the chapter rarity in database
      await dbRef.current.runAsync(
        'INSERT OR REPLACE INTO ChapterRarities (Book, Chapter, Rarity) VALUES (?, ?, ?);',
        [bookName, chapterNum, rarity]
      );

      // Update local state
      setBibleBooks(prevBooks => 
        prevBooks.map(book => {
          if (book.bookName !== bookName) return book;
          
          const updatedChapters = book.chapters?.map(ch => 
            ch.chapter === chapterNum ? { ...ch, rarity } : ch
          ) ?? [];
          
          return {
            ...book,
            chapters: updatedChapters
          };
        })
      );

      if (shouldUpdateBook) {
        await updateBookEnabledStatus(bookName);
      }

    } catch (err) {
      console.error('Failed to update rarity:', err);
    }
  }, [dbRef.current, updateBookEnabledStatus]);

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
  }), [bibleBooks, error]);

  return (
    <BibleBooksContext.Provider value={contextValue}>
      {children}
    </BibleBooksContext.Provider>
  );
};

export const useBibleBooks = () => {
  const context = useContext(BibleBooksContext);
  if (!context) {
    throw new Error('useBibleBooks must be used within a BibleBooksProvider');
  }
  return context;
};