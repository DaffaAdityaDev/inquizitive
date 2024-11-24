export const REGEX_PATTERNS = {
  JSON_WITH_TAGS: /<json>([\s\S]*?)<\/json>/,
  OUTPUT_TAGS: /<output>[\s\S]*?{[\s\S]*?}[\s\S]*?<\/output>/,
  CODE_BLOCK: /```json\s*([\s\S]*?)```/,
  QUESTIONS_OBJECT: /{[\s\S]*"questions"[\s\S]*}/
}

export const ERROR_MESSAGES = {
  PARSE_ERROR: "Failed to parse input",
  VALIDATION_ERROR: "Invalid question format",
  NO_QUESTIONS: "No questions available"
}

export const TOAST_DURATION = 2000
