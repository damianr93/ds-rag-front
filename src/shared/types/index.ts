// Tipos compartidos para toda la aplicación

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  snippet?: string;
  source: string;
  publishedDate: string;
  origin: 'serper' | 'rss';
  matchedKeywords?: string[];
  alertKeywords?: string[];
  isAlert?: boolean;
}

export interface Alert extends NewsArticle {
  isAlert: true;
  alertKeywords: string[];
}

export interface Keyword extends BaseEntity {
  word: string;
  priority: 'low' | 'medium' | 'high';
  alert: boolean;
  userId: number;
}

export interface RssSource extends BaseEntity {
  url: string;
  name?: string;
  userId: number;
}

export interface GlobalRssSource extends BaseEntity {
  url: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: number;
}

export interface UserRssPreference extends BaseEntity {
  userId: number;
  globalRssSourceId: number;
  isActive: boolean;
}

export interface Feed extends BaseEntity {
  userId: number;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface FeedKeyword extends BaseEntity {
  feedId: number;
  word: string;
  priority: 'low' | 'medium' | 'high';
  alert: boolean;
}

export interface FeedSource extends BaseEntity {
  feedId: number;
  url: string;
  name?: string;
}

export interface FeedData {
  feed: Feed;
  keywords: FeedKeyword[];
  sources: FeedSource[];
  news: NewsArticle[];
  alerts: Alert[];
  aiAnalysis?: any;
}

export interface SearchParams {
  query: string;
  country?: string;
  dateRange?: string;
  resultLimit?: number;
}

export interface FilterParams {
  country: string;
  dateRange: string;
  resultLimit: number;
}

export interface CartItem extends NewsArticle {
  addedAt: string;
}

export interface AiAnalysis {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface ScrapeResult {
  totals: {
    total: number;
    withSnippet: number;
    withoutSnippet: number;
  };
  articles: NewsArticle[];
}

export interface NewsState {
  news: NewsArticle[];
  alerts: Alert[];
  keywords: Keyword[];
  sources: RssSource[];
  searchResults: {
    news: NewsArticle[];
    alerts: Alert[];
    aiAnalysis?: AiAnalysis;
    sourcesUsed: string[];
  } | null;
  aiAnalysis: AiAnalysis | null;
  scrapeResult: ScrapeResult | null;
  scrapeError: string | null;
  scrapingSelection: boolean;
  lastUpdated: string | null;
  loading: boolean;
  error: string | null;
}

export interface FeedsState {
  feeds: Feed[];
  selectedFeed: Feed | null;
  feedData: FeedData | null;
  loading: boolean;
  error: string | null;
  showFeedManager: boolean;
  sidebarOpen: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export interface DisclaimerState {
  hasAccepted: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export interface GlobalRssState {
  sources: GlobalRssSource[];
  userPreferences: UserRssPreference[];
  loading: boolean;
  error: string | null;
}

export interface AdminRssState {
  sources: GlobalRssSource[];
  loading: boolean;
  error: string | null;
}

export interface RagState {
  conversations: any[];
  currentConversation: any | null;
  messages: any[];
  loading: boolean;
  error: string | null;
}

export interface SerperFiltersState {
  country: string;
  dateRange: string;
  resultLimit: number;
}

export interface RootState {
  news: NewsState;
  feeds: FeedsState;
  auth: AuthState;
  cart: CartState;
  disclaimer: DisclaimerState;
  globalRss: GlobalRssState;
  adminRss: AdminRssState;
  rag: RagState;
  serperParams: SerperFiltersState;
}
