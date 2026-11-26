// Frontend TypeScript interfaces based on backend Interview schema
// This ensures type safety and consistency between frontend and backend

export interface InterviewCurrentQuestion {
  id: string;
  question: string;
  questionNumber: number;
  totalQuestions?: number | null;
  isWrappingUp?: boolean;
  interviewPhase?: string;
}

export interface InterviewScores {
  overall: number;
  technical: number;
  communication: number;
  problemSolving: number;
  codeQuality: number;
  improvement?: string;
}

export interface InterviewProgress {
  questionsAnswered: number;
  totalQuestions?: number | null;
  completionPercentage: number;
  elapsedSeconds?: number;
  remainingSeconds?: number;
  durationMinutes?: number;
  isWrappingUp?: boolean;
  interviewPhase?: string;
  durationControlled?: boolean;
}

export interface InterviewDetailedScores {
  technical: number;
  communication: number;
  problemSolving: number;
  codeQuality: number;
  timeManagement: number;
}

export interface InterviewQuestionBreakdown {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  difficulty: string;
  category: string;
}

export interface InterviewScoreboard {
  totalQuestions?: number | null;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  accuracyRate: number;
  averageResponseTime: number;
  totalTimeSpent: number;
  performanceGrade: string;
  detailedScores: InterviewDetailedScores;
  questionBreakdown: InterviewQuestionBreakdown[];
}

export interface ConversationMetadata {
  responseTime?: number;
  confidence?: number;
  followUp?: boolean;
}

export interface ConversationMessage {
  timestamp: Date;
  sender: 'user' | 'ai';
  message: string;
  questionId?: string;
  messageType: 'question' | 'answer' | 'feedback' | 'clarification';
  metadata?: ConversationMetadata;
}

export interface InterviewConfiguration {
  level: string;
  category: string;
  field?: string;
  duration: number;
  language: string;
  hasCodeEditor: boolean;
  isFreeInterview: boolean;
}

export interface SuggestedMentor {
  name: string;
  expertise: string[];
}

export interface InterviewDetailedAnalysis {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export interface InterviewNextRecommendations {
  suggestedMentors: SuggestedMentor[];
  practiceAreas: string[];
}

export interface InterviewResults {
  detailedAnalysis: InterviewDetailedAnalysis;
  nextRecommendations: InterviewNextRecommendations;
}

// Main Interview interface matching the backend schema
export interface Interview {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile';
  duration: number;
  language: string;
  hasCodeEditor: boolean;
  status: 'active' | 'completed' | 'terminated';
  startTime: Date;
  endTime?: Date;
  currentQuestion?: InterviewCurrentQuestion;
  scores?: InterviewScores;
  progress?: InterviewProgress;
  scoreboard?: InterviewScoreboard;
  conversationHistory: ConversationMessage[];
  configuration?: InterviewConfiguration;
  questionIds: string[];
  results?: InterviewResults;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interview creation payload (for starting new interviews)
export interface CreateInterviewPayload {
  userId: string;
  userName: string;
  userEmail: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile';
  field?: string;
  duration: number;
  language: string;
  hasCodeEditor: boolean;
  isFreeInterview: boolean;
}

// Interview update payload (for updating interview progress)
export interface UpdateInterviewPayload {
  sessionId: string;
  currentQuestion?: InterviewCurrentQuestion;
  scores?: Partial<InterviewScores>;
  progress?: Partial<InterviewProgress>;
  scoreboard?: Partial<InterviewScoreboard>;
  conversationHistory?: ConversationMessage[];
  status?: 'active' | 'completed' | 'terminated';
  endTime?: Date;
  results?: Partial<InterviewResults>;
}

// Interview session state for frontend management
export interface InterviewSessionState {
  interview: Interview | null;
  isLoading: boolean;
  error: string | null;
  currentQuestionIndex: number;
  timeRemaining: number;
  isRecording: boolean;
  isProcessing: boolean;
  audioUrl: string | null;
  codeEditorContent: string;
  userResponse: string;
}

// Interview API responses
export interface InterviewApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface StartInterviewResponse {
  sessionId: string;
  interview: Interview;
  firstQuestion: InterviewCurrentQuestion;
}

export interface SubmitAnswerResponse {
  nextQuestion?: InterviewCurrentQuestion;
  feedback?: string;
  scores?: InterviewScores;
  progress?: InterviewProgress;
  isCompleted?: boolean;
}

export interface CompleteInterviewResponse {
  finalScores: InterviewScores;
  scoreboard: InterviewScoreboard;
  results: InterviewResults;
  certificateEligible: boolean;
}

// Enums for type safety
export enum SeniorityLevel {
  FRESHER = 'fresher',
  JUNIOR = 'junior',
  MID_LEVEL = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager'
}

export enum InterviewMode {
  QUICK_PRACTICE = 'quick_practice',
  MOCK_INTERVIEW = 'mock_interview',
  TECHNICAL_ASSESSMENT = 'technical_assessment',
  BEHAVIORAL = 'behavioral',
  HR = 'hr',
  RESUME = 'resume',
  JD_BASED = 'jd_based',
  SCENARIO = 'scenario',
  FINAL_ASSESSMENT = 'final_assessment'
}

export interface CompetencyEvaluation {
  name: string;
  score: number;
  reason: string;
  evidence: string;
  improvement: string;
}

export interface SkillGaps {
  strong_skills: string[];
  weak_skills: string[];
  missing_skills: string[];
  topics_requiring_practice: string[];
}

export interface CoachDayPlan {
  day: number;
  topic: string;
  action: string;
}

export interface CommunicationMetrics {
  clarity: number;
  structure: number;
  conciseness: number;
  pacing: number;
  pacingEvaluation?: string;
  totalWordsSpoken?: number;
  totalFillerWords?: number;
  fillerBreakdown?: Record<string, number>;
}

export interface InterviewBlueprint {
  role: string;
  field: string;
  seniority: string;
  interview_mode: string;
  mode_title?: string;
  proctoring_strictness?: string;
  duration_minutes: number;
  target_difficulty: string;
  competencies: Array<{ name: string; weight: number; status?: string }>;
  seniority_expectation?: string;
  question_distribution?: Record<string, number>;
  resume_topics?: string[];
  jd_topics?: string[];
  skill_gaps?: Array<{ skill: string; status: string; gap_analysis: string }>;
  behavioral_topics?: string[];
  scenario_topics?: string[];
  evaluation_rubric?: Record<string, string>;
}

export enum InterviewLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum InterviewCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
  MOBILE = 'mobile',
  SOFTWARE_ENGINEER = "software_engineer",
  CLOUD_ENGINEER = "cloud_engineer",
  CYBERSECURITY = "cybersecurity_engineer",
  DEVOPS_ENGINEER = "DEVOPS_ENGINEER",
  CLOUD_ARCHITECT = "CLOUD_ARCHITECT",
  DATA_ANALYST = "DATA_ANALYST",
  BUSINESS_ANALYST = "BUSINESS_ANALYST",
  FINANCIAL_ANALYST = "FINANCIAL_ANALYST",
  FINANCE = "finance",
  MARKETING = "marketing",
  SALES = "sales",
  HR = "hr",
  OPERATIONS = "operations",
  CONTENT = "content",
  DESIGN = "design",
  SOCIAL_MEDIA_MARKETING = "SOCIAL_MEDIA_MARKETING",
  DIGITAL_MARKETING = "DIGITAL_MARKETING",
  CONTENT_MARKETING = "CONTENT_MARKETING",
  HR_GENERALIST = "HR_GENERALIST",
  HR_RECRUITER = "HR_RECRUITER",
  HR_BUSINESS_PARTNER = "HR_BUSINESS_PARTNER",
  CONTENT_WRITER = "CONTENT_WRITER",
  COPYWRITER = "COPYWRITER",
  TECHNICAL_WRITER = "TECHNICAL_WRITER",
  UI_UX_DESIGNER = "UI_UX_DESIGNER"
}

export enum InterviewStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated'
}

export enum MessageType {
  QUESTION = 'question',
  ANSWER = 'answer',
  FEEDBACK = 'feedback',
  CLARIFICATION = 'clarification'
}

export enum MessageSender {
  USER = 'user',
  AI = 'ai'
}

// Utility types for form handling
export type InterviewFormData = Omit<CreateInterviewPayload, 'userId' | 'userName' | 'userEmail'>;

export type InterviewConfigForm = {
  level: InterviewLevel;
  category: InterviewCategory;
  duration: number;
  language: string;
  hasCodeEditor: boolean;
};

// Local storage keys for interview data
export const INTERVIEW_STORAGE_KEYS = {
  CURRENT_SESSION: 'topplaced_current_interview_session',
  SESSION_HISTORY: 'topplaced_interview_history',
  USER_PREFERENCES: 'topplaced_interview_preferences',
  DRAFT_RESPONSES: 'topplaced_draft_responses'
} as const;

// Default values
export const DEFAULT_INTERVIEW_CONFIG: InterviewConfigForm = {
  level: InterviewLevel.INTERMEDIATE,
  category: InterviewCategory.FULLSTACK,
  duration: 30,
  language: 'javascript',
  hasCodeEditor: true
};

export const DEFAULT_SCORES: InterviewScores = {
  overall: 0,
  technical: 0,
  communication: 0,
  problemSolving: 0,
  codeQuality: 0
};

export const DEFAULT_PROGRESS: InterviewProgress = {
  questionsAnswered: 0,
  totalQuestions: null,
  completionPercentage: 0
};