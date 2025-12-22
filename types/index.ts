export type QuestionType = 'MULTIPLE_CHOICE' | 'OPEN_ENDED';

export interface Question {
  q: string;
  options?: string[]; // For MC
  answer: string;
  explanation: string;
  type?: QuestionType; // Optional, default to MC
}

export interface ReviewItem {
  id: string;
  user_id: string;
  topic: string;
  question_json: Question;
  srs_level: number;
  ease_factor: number;
  interval_days: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  created_at: string;
  tags: string[];
}
