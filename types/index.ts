export type Rarity = 'common' | 'uncommon' | 'rare' | 'ultraRare' | 'disabled';

export interface Verse {
  verseNumber: number;
  text: string;
  duplicateLocations: DuplicateLocation[];
}

export interface Chapter {
  chapter: number;
  summary?: string;
  verses: Verse[];
  rarity?: Rarity;
}

export interface BibleBook {
  bookName: string;
  enabled: boolean;
  chapters?: Chapter[];
}

export type DuplicateLocation = {
  Book: string;
  Chapter: number;
  Verse: number;
};

export type AppUser = {
  id: string;
  email: string;
  // role?: string;
};

export type AppSession = {
  userId: string;
  accessToken?: string;
  expiresAt?: number; // UNIX timestamp (in seconds)
  issuedAt?: number;  // Optional for token management/debugging
};

export interface UserSettings {
  swapPressActions: boolean;
  // Add more settings as needed
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  overall_score: number;
  rank?: number;
}

export interface AuthService {
  signIn(email: string, password: string): Promise<{ user: AppUser; session: AppSession }>;
  signUp(email: string, password: string, username: string): Promise<any>;
  signOut(): Promise<void>;
  getSession(): Promise<AppSession | null>;
  resendVerificationEmail(email: string): Promise<void>;
  deleteAccount(accessToken: string, userId: string): Promise<void>;
  init(): Promise<{ session: AppSession | null; user: AppUser | null; profile: { username: string } | null }>;
}

export interface UsernamesService {
  checkAvailability(username: string): Promise<{ available: boolean; error?: string }>;
  updateUsername(userId: string, newUsername: string): Promise<void>;
}

export interface ScoreService {
  getOverallScoreFromServer(userId: string): Promise<{ overallScore: number; error?: string }>;
  updateOverallScoreOnServer(userId: string, overallScore: number): Promise<void>;
  incrementUserScoreRpc(userId: string, points: number): Promise<void>;
  fetchTopScores(limit?: number): Promise<LeaderboardEntry[]>;
}

export interface BibleBooksService {
  fetchAll(userId: string): Promise<BibleBook[]>;
  toggleEnabled(userId: string, bookName: string): Promise<BibleBook>;
  updateChapterRarity(userId: string, bookName: string, chapterNum: number, rarity: Rarity): Promise<Chapter>;
}

export interface SettingsService {
  getSettings(userId: string): Promise<UserSettings>;
  updateSettings(userId: string, settings: UserSettings): Promise<UserSettings>;
}

export interface BackendService {
  auth: AuthService;
  usernames: UsernamesService;
  score: ScoreService;
  bibleBooks: BibleBooksService;
  settings: SettingsService;
}