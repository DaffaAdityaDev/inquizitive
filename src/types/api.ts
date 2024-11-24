import { QuestionType } from './index'

export interface APIError extends Error {
    status: number;
    code: string;
    data: Record<string, unknown> | string;
}
  
export interface ParsedFeedback {
    number: number;
    question: string;
    provided_answer: string;
    type: QuestionType;
    options?: string[];
    correct_option?: string;
    evaluation: string;
    grade: string;
    expected_answer?: string;
    explanations?: Record<string, string>;
    resources?: string[];
}