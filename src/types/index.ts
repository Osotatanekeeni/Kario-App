// ---------------------------------------------------------------------------
// Emotion
// ---------------------------------------------------------------------------

export type EmotionLabel =
  | 'calm'
  | 'focused'
  | 'confident'
  | 'patient'
  | 'anxious'
  | 'fearful'
  | 'greedy'
  | 'frustrated'
  | 'euphoric'
  | 'impulsive'
  | 'detached'
  | 'overwhelmed';

export interface EmotionSnapshot {
  label: EmotionLabel;
  intensity: number;
  notes?: string;
  recordedAt: string;
}

// ---------------------------------------------------------------------------
// Trade Journal
// ---------------------------------------------------------------------------

export type TradeDirection = 'long' | 'short';
export type TradeOutcome = 'win' | 'loss' | 'breakeven';
export type TradeStatus = 'open' | 'closed';

export interface TradeEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  outcome?: TradeOutcome;
  emotionBefore: EmotionSnapshot;
  emotionAfter?: EmotionSnapshot;
  setupQuality?: number;
  executionQuality?: number;
  disciplineScore?: number;
  rulesFollowed: string[];
  rulesBroken: string[];
  notes: string;
  lessonsLearned?: string;
  tags: string[];
  sessionId?: string;
}

// ---------------------------------------------------------------------------
// Discipline
// ---------------------------------------------------------------------------

export type RuleCategory = 'entry' | 'exit' | 'risk' | 'psychology' | 'process';

export interface DisciplineRule {
  id: string;
  title: string;
  description?: string;
  category: RuleCategory;
  isActive: boolean;
  createdAt: string;
}

export interface DisciplineMetrics {
  overallScore: number;
  rulesFollowedRate: number;
  emotionalConsistency: number;
  entryQuality: number;
  exitQuality: number;
  totalTrades: number;
  period: 'day' | 'week' | 'month' | 'all';
}

// ---------------------------------------------------------------------------
// AI Reflection Coaching
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant';

export interface ReflectionMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface ReflectionSession {
  id: string;
  createdAt: string;
  tradeEntryId?: string;
  messages: ReflectionMessage[];
  summary?: string;
  insights?: string[];
  mood: EmotionLabel;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export type TradingStyle = 'scalper' | 'day-trader' | 'swing-trader' | 'position-trader';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type AppTheme = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  displayName?: string;
  tradingStyle?: TradingStyle;
  experienceLevel?: ExperienceLevel;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface UserPreferences {
  theme: AppTheme;
  defaultCurrency: string;
  tradingHours?: {
    start: string;
    end: string;
  };
  reminderEnabled: boolean;
  reminderTime?: string;
}
