export type PromptQuestionType = 'OPEN_ENDED' | 'MULTIPLE_CHOICE' | 'MIXED'
export type PromptDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type PromptLanguage = 'en' | 'id'

export interface PromptOptions {
  questionType: PromptQuestionType
  count: number
  difficulty: PromptDifficulty
  language: PromptLanguage
}

export interface PromptRequest extends PromptOptions {
  topic: string
  sourceMaterial?: string
  /** Learner data and adaptation instructions, inserted as its own section. */
  learnerContext?: string
}

export const QUESTION_COUNTS = [5, 10, 15, 20] as const

export const QUESTION_TYPE_LABELS: Record<PromptQuestionType, string> = {
  OPEN_ENDED: 'Open-ended',
  MULTIPLE_CHOICE: 'Multiple choice',
  MIXED: 'Mixed'
}

export const DIFFICULTY_LABELS: Record<PromptDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
}

export const LANGUAGE_LABELS: Record<PromptLanguage, string> = {
  en: 'English',
  id: 'Bahasa Indonesia'
}

export const DEFAULT_PROMPT_OPTIONS: PromptOptions = {
  questionType: 'OPEN_ENDED',
  count: 10,
  difficulty: 'intermediate',
  language: 'en'
}

const DIFFICULTY_GUIDANCE: Record<PromptDifficulty, string> = {
  beginner: 'Beginner: focus on core definitions, basic concepts and simple, direct applications. Avoid edge cases.',
  intermediate: 'Intermediate: mix conceptual understanding with practical application and common pitfalls.',
  advanced: 'Advanced: probe deep understanding, trade-offs, edge cases, internals and multi-step reasoning.'
}

const RESOURCES_EXAMPLE = `        "resources": [
          "[Official Docs]: [Page title](https://...)",
          "[Article]: [Page title](https://...)"
        ]`

const OPEN_ENDED_EXAMPLE = `      {
        "number": 1,
        "type": "OPEN_ENDED",
        "key_concept": "Short name of the concept tested",
        "question": "Explain ... ?",
        "expected_answer": "A complete model answer covering the key points a strong response must include...",
        "key_points": [
          "First point a complete answer must mention",
          "Second point...",
          "Third point..."
        ],
        "explanation": "Why this is the answer: the underlying idea, a concrete example, and the most common mistake...",
${RESOURCES_EXAMPLE}
      }`

const MULTIPLE_CHOICE_EXAMPLE = (number: number) => `      {
        "number": ${number},
        "type": "MULTIPLE_CHOICE",
        "key_concept": "Short name of the concept tested",
        "question": "Which of the following ... ?",
        "options": [
          "A) First option",
          "B) Second option",
          "C) Third option",
          "D) Fourth option"
        ],
        "correct_option": "A",
        "explanations": {
          "A": "Why this is correct, with the reasoning or a short example...",
          "B": "Why this is wrong, and the misconception that makes it look right...",
          "C": "Why this is wrong...",
          "D": "Why this is wrong..."
        },
        "explanation": "The underlying concept in a few sentences, with a concrete example, so the learner understands it rather than memorising the letter...",
${RESOURCES_EXAMPLE}
      }`

const OPEN_ENDED_RULES = `- Open-ended questions ("type": "OPEN_ENDED")
  - Encourage explanation and critical thinking, not one-word answers
  - Include both theoretical and practical questions
  - "expected_answer" must be a complete model answer that can be used to grade a response
  - "key_points" lists the 2-5 points a complete answer must cover`

const MULTIPLE_CHOICE_RULES = `- Multiple choice questions ("type": "MULTIPLE_CHOICE")
  - Exactly 4 options, prefixed "A) ", "B) ", "C) ", "D) ", similar in length and structure
  - Exactly one clearly correct option; "correct_option" is just its letter (e.g. "B")
  - Plausible distractors based on common misconceptions; no "all/none of the above", no double negatives
  - Vary the position of the correct letter across questions
  - "explanations" has one entry per letter: why the correct one is right, and for each wrong one the misconception behind it`

const LEARNING_RULES = `- Every question also teaches, so the learner can study straight from the results:
  - "key_concept": a short name (2-6 words) for the concept the question tests
  - "explanation": the underlying idea in 2-4 sentences, with a concrete example (a code snippet when relevant) and the most common mistake
  - "resources": 1-3 references to learn more, formatted "[Type]: [Title](url)" where Type is Official Docs, Article, Tutorial, Video or Book. Prefer official documentation and well-known, stable sources, and link the most specific page you are confident exists; if you are unsure of an exact URL, link the source's main documentation page instead of guessing a deep link`

const SOURCE_RESOURCES_RULE = `- Because the questions come from the source material, the first "resources" entry should point to where the answer is found in it, e.g. "[Source]: Section 'Event loop', paragraph 2" (no URL needed)`

function typeInstructions(type: PromptQuestionType, count: number): string {
  if (type === 'OPEN_ENDED') return `Generate exactly ${count} open-ended questions.\n\n${OPEN_ENDED_RULES}`
  if (type === 'MULTIPLE_CHOICE') return `Generate exactly ${count} multiple choice questions.\n\n${MULTIPLE_CHOICE_RULES}`
  const mcq = Math.ceil(count / 2)
  return `Generate exactly ${count} questions: ${mcq} multiple choice and ${count - mcq} open-ended, interleaved in one list.\n\n${MULTIPLE_CHOICE_RULES}\n${OPEN_ENDED_RULES}`
}

function exampleQuestions(type: PromptQuestionType): string {
  if (type === 'OPEN_ENDED') return OPEN_ENDED_EXAMPLE
  if (type === 'MULTIPLE_CHOICE') return MULTIPLE_CHOICE_EXAMPLE(1)
  return `${MULTIPLE_CHOICE_EXAMPLE(1)},\n${OPEN_ENDED_EXAMPLE.replace('"number": 1', '"number": 2')}`
}

function languageInstructions(language: PromptLanguage): string {
  if (language === 'id') {
    return 'Write all question text, options, expected answers, key points, concepts and explanations in Bahasa Indonesia. Keep the JSON keys and the "type" values exactly in English as shown. References may be in English when that is the best source.'
  }
  return 'Write all question text, options, expected answers, key points, concepts and explanations in English.'
}

/** Builds the base prompt the user pastes into a free web AI chat. */
export function buildQuizPrompt({ topic, sourceMaterial, questionType, count, difficulty, language, learnerContext }: PromptRequest): string {
  const source = sourceMaterial?.trim()
  const sourceSection = source
    ? `
## Source Material

Base the questions ONLY on the material between the <source> tags. Do not ask about anything it does not cover.

<source>
${source}
</source>
`
    : ''

  return `# Self-Testing Quiz Generator

You are a meticulous teacher creating self-testing material on: ${topic.trim()}

## Requirements

${typeInstructions(questionType, count)}

${LEARNING_RULES}${source ? `
${SOURCE_RESOURCES_RULE}` : ''}

- Difficulty: ${DIFFICULTY_GUIDANCE[difficulty]}
- Language: ${languageInstructions(language)}
- Number the questions 1 to ${count}.
${sourceSection}${learnerContext?.trim() ? `\n${learnerContext.trim()}\n` : ''}
## Output Format

Think it through first inside <thinking> tags (key concepts to cover), then return ONLY the questions inside <output> tags as valid JSON (straight double quotes, no trailing commas, no comments) in exactly this shape:

<output>
{
  "topic": "Short name of the overall topic",
  "questions": [
${exampleQuestions(questionType)}
  ]
}
</output>`
}
