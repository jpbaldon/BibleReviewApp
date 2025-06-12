import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { ASV } from '@/data/asv';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'ultraRare' | 'disabled';

export interface Verse {
  VerseNumber: number;
  Text: string;
}

export interface Chapter {
  Chapter: number;
  Summary?: string;
  Verses: Verse[];
  rarity?: Rarity;
}

export interface BibleBook {
  Book: string;
  Enabled: boolean;
  Chapters?: Chapter[];
}

interface BibleBooksContextType {
  bibleBooks: BibleBook[];
  toggleBookEnabled: (bookName: string) => Promise<void>;
  updateChapterRarity: (bookName: string, chapter: number, rarity: Rarity) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshBooks: () => Promise<void>;
}

const BibleBooksContext = createContext<BibleBooksContextType>({
  bibleBooks: [],
  toggleBookEnabled: async () => {},
  updateChapterRarity: async () => {},
  isLoading: true,
  error: null,
  refreshBooks: async () => {},
});

export const BibleBooksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  // Initialize database asynchronously
  const openDatabase = useCallback(async () => {
    try {
      // Ensure SQLite directory exists
      if (!(await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`)).exists) {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`);
      }

      return await SQLite.openDatabaseAsync('biblebooks.db');
    } catch (err) {
      console.error('Failed to open database:', err);
      throw err;
    }
  }, []);

  const loadBooksFromDB = useCallback(async (dbInstance: SQLite.SQLiteDatabase) => {
    try {
      const results = await dbInstance.getAllAsync<{Book: string, Enabled: number}>(
        'SELECT * FROM BibleBooks;'
      );
      return results.map(book => ({
        Book: book.Book,
        Enabled: book.Enabled === 1
      }));
    } catch (err) {
      console.error('Failed to load books:', err);
      throw err;
    }
  }, []);

  const initializeDatabase = useCallback(async (dbInstance: SQLite.SQLiteDatabase) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Create table if not exists
      await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS BibleBooks (
          Book TEXT PRIMARY KEY NOT NULL,
          Enabled INTEGER NOT NULL DEFAULT 0
        );
      `);

      await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS ChapterRarities (
        Book TEXT NOT NULL,
        Chapter INTEGER NOT NULL,
        Rarity TEXT NOT NULL DEFAULT 'common',
        PRIMARY KEY (Book, Chapter)
        );
      `);

      // 2. Check if table is empty
      const countResult = await dbInstance.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM BibleBooks;'
      );
      
      // 3. Initialize with default books if empty
      if (!countResult || countResult.count === 0) {
        await dbInstance.execAsync('BEGIN TRANSACTION');
        try {
          for (const book of ASV.Bible) {
            const isGenesis = book.Book === "Genesis";
            await dbInstance.runAsync(
              'INSERT OR IGNORE INTO BibleBooks (Book, Enabled) VALUES (?, ?);',
              [book.Book, isGenesis ? 1 : 0]
            );
          }
          await dbInstance.execAsync('COMMIT');
        } catch (txError) {
          await dbInstance.execAsync('ROLLBACK');
          throw txError;
        }
      }

      // 4. Load books
      const loadedBooks = await loadBooksFromDB(dbInstance);

      const rarityResults = await dbInstance.getAllAsync<{Book: String, Chapter: Number, Rarity: Rarity}>(
        'SELECT * FROM ChapterRarities'
      );

      const enrichedBooks = loadedBooks.map(book => {
        const asvBook = ASV.Bible.find(b => b.Book === book.Book);
        const chapterWithRarity = asvBook?.Chapters.map(ch => {
          const match = rarityResults.find(r => r.Book === book.Book && r.Chapter === ch.Chapter);
          return {
            ...ch,
            rarity: match?.Rarity ?? 'common',
          };
        }) ?? [];
        return {
          ...book,
          Chapters: asvBook?.Chapters ?? []
        };
      });

      setBibleBooks(enrichedBooks);

    } catch (err) {
      console.error('Database initialization failed:', err);
      setError('Database error. Using default books.');
      setBibleBooks(ASV.Bible.map(book => ({ Book: book.Book, Enabled: false })));
    } finally {
      setIsLoading(false);
    }
  }, [loadBooksFromDB]);



  useEffect(() => {
    let mounted = true;
    
    const initDB = async () => {
      try {
        const database = await openDatabase();
        if (mounted) {
          setDb(database);
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
  }, [openDatabase, initializeDatabase]);

  const refreshBooks = useCallback(async () => {
    if (!db) return;
    
    try {
      setIsLoading(true);
      const loadedBooks = await loadBooksFromDB(db);
      setBibleBooks(loadedBooks);
      setError(null);
    } catch (err) {
      console.error('Refresh failed:', err);
      setError('Failed to refresh books');
    } finally {
      setIsLoading(false);
    }
  }, [db, loadBooksFromDB]);

  const toggleBookEnabled = useCallback(async (bookName: string) => {
    if (!db) return;

    try {
      setError(null);

      // Get the most up-to-date enabled value from the DB
      const result = await db.getFirstAsync<{ Enabled: number }>(
        'SELECT Enabled FROM BibleBooks WHERE Book = ?;',
        [bookName]
      );

      if (!result) {
        throw new Error(`Book not found: ${bookName}`);
      }

      const currentEnabled = result.Enabled === 1;
      const newEnabled = !currentEnabled;

      // Update in DB
      await db.runAsync(
        'UPDATE BibleBooks SET Enabled = ? WHERE Book = ?;',
        [newEnabled ? 1 : 0, bookName]
      );

      setBibleBooks(prevBooks => {
          const bookIndex = prevBooks.findIndex(b => b.Book === bookName);
          if (bookIndex === -1) return prevBooks;

          const newBooks = [...prevBooks];
          newBooks[bookIndex] = {
            ...newBooks[bookIndex],
            Enabled: newEnabled
          };
          return newBooks;
        }
      );

    } catch (err) {
      console.error('Toggle failed:', err);
      setError(`Toggle failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {

    }
  }, [db]);

  // Automatically disables a book if no chapters in the book are enabled (prevents awkwardness on other tabs when the user is being)
  const updateBookEnabledStatus = useCallback(async (bookName: string) => {
    setBibleBooks(prevBooks => {
      const book = prevBooks.find(b => b.Book === bookName);
      if(!book) return prevBooks;

      const allDisabled = book.Chapters?.every(chapter => chapter.rarity === 'disabled');

      if(allDisabled) {
        toggleBookEnabled(bookName);
      }
      return prevBooks;
    });
    
  }, [toggleBookEnabled]);

  const updateChapterRarity = useCallback(async (bookName: string, chapterNum: number, rarity: Rarity) => {
    if (!db) return;

    try {
      await db.runAsync(
        'INSERT OR REPLACE INTO ChapterRarities (Book, Chapter, Rarity) VALUES (?, ?, ?);',
        [bookName, chapterNum, rarity]
      );

      setBibleBooks(prevBooks => 
        prevBooks.map(book => {
          if (book.Book !== bookName) return book;
          return {
            ...book,
            Chapters: book.Chapters?.map(ch => 
              ch.Chapter === chapterNum ? { ...ch, rarity } : ch
            ),
          };
        })
      );

      await updateBookEnabledStatus(bookName);

    } catch (err) {
      console.error('Failed to update rarity:', err);
    }
  }, [db, updateBookEnabledStatus]);

  const contextValue = useMemo(() => ({
    bibleBooks,
    toggleBookEnabled,
    updateChapterRarity,
    isLoading,
    error,
    refreshBooks,
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