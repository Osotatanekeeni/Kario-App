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
  /** 1–10: how strongly the emotion was felt */
  intensity: number;
  notes?: string;
  recordedAt: string; // ISO 8601
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

  /** Pre-trade emotional state */
  emotionBefore: EmotionSnapshot;
  /** Post-trade emotional state — only present when status is 'closed' */
  emotionAfter?: EmotionSnapshot;

  /** 1–10 self-assessed quality scores */
  setupQuality?: number;
  executionQuality?: number;
  /** Composite discipline score computed from rules + quality */
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
  /** 0–100 composite score */
  overallScore: number;
  /** 0–1 ratio of rules followed vs. available */
  rulesFollowedRate: number;
  /** 0–100 emotional consistency across entries */
  emotionalConsistency: number;
  /** 0–100 average setup quality */
  entryQuality: number;
  /** 0–100 average execution quality */
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
  /** Brief AI-generated summary produced at session close */
  summary?: string;
  /** Key behavioral insights extracted by the AI */
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
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  reminderEnabled: boolean;
  reminderTime?: string; // HH:mm
}
