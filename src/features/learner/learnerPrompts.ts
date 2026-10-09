import { Confidence, ParsedFeedback } from '../../shared/types'
import { resolveFeedbackScore } from '../mastery/utils/masteryUpdates'
import { buildQuizPrompt, PromptOptions } from '../prompts/constants/promptTemplates'
import { ConceptSummary, LearnerProfile, selectDueConcepts, summarizeProfile } from './learnerProfile'

const MAX_WEAK = 8
const MAX_STRONG = 8

function describeConcept(s: ConceptSummary) {
  return {
    concept: s.record.concept,
    ...(s.record.topic ? { topic: s.record.topic } : {}),
    last_score: s.lastScore,
    attempts: s.record.attempts.length,
    ...(s.overconfidentCount ? { confidently_wrong_times: s.overconfidentCount } : {}),
    ...(s.record.misconceptions.length ? { misconceptions: s.record.misconceptions } : {}),
    ...(s.record.missingPoints.length ? { often_missed: s.record.missingPoints } : {})
  }
}

/**
 * Learner-profile section for a brand-new quiz. The AI decides which entries
 * relate to the requested topic, so the profile can stay topic-agnostic.
 */
export function learnerContextForNewQuiz(profile: LearnerProfile, now: number = Date.now()): string {
  const summaries = summarizeProfile(profile, now)
  const weak = summaries.filter(s => s.status === 'weak').slice(0, MAX_WEAK)
  const strong = summaries.filter(s => s.status === 'strong').slice(0, MAX_STRONG)
  if (weak.length === 0 && strong.length === 0) return ''

  return `## Learner Profile

This learner's history from earlier quizzes. Use it only where it relates to the topic above; ignore unrelated entries.
- Weak concepts: include questions that target them from a new angle and directly test the listed misconceptions.
- Strong concepts: only ask about them at a harder level than before.

${JSON.stringify({
    weak: weak.map(describeConcept),
    strong: strong.map(s => s.record.concept)
  }, null, 2)}
`
}

export interface RoundResultInput {
  feedback: ParsedFeedback[]
  confidence: Record<number, Confidence | undefined>
}

function describeResult(item: ParsedFeedback, confidence?: Confidence) {
  return {
    ...(item.key_concept ? { concept: item.key_concept } : {}),
    question: item.question,
    answer: item.provided_answer,
    score: resolveFeedbackScore(item),
    ...(confidence ? { confidence } : {}),
    ...(item.missing_points?.length ? { missing_points: item.missing_points } : {}),
    ...(item.misconceptions?.length ? { misconceptions: item.misconceptions } : {})
  }
}

/**
 * Prompt for an AI-generated follow-up round: new questions aimed at this
 * round's gaps (and the learner's history), instead of repeating the same ones.
 */
export function buildAdaptiveRoundPrompt(
  topic: string,
  round: RoundResultInput,
  profile: LearnerProfile,
  options: PromptOptions
): string {
  const results = round.feedback.map(item => describeResult(item, round.confidence[item.number]))
  const history = learnerContextForNewQuiz(profile)

  const context = `## Adaptive Round

The learner just finished a round on this topic. Their results:

${JSON.stringify({ results }, null, 2)}

Write the next round to close their gaps as fast as possible:
- About 70% of the questions re-test concepts they scored below 85 on, answered as a guess, or got wrong while "sure". Use a new angle each time (different scenario, wording or question type) and aim each question at the specific misconception or missing point.
- About 30% step up concepts they clearly know, with harder application or edge-case questions.
- Never reuse or lightly reword any question above.
- Adjust the difficulty: if most scores were low, simplify and build up step by step; if most were high, go harder.
${history ? `\n${history}` : ''}`

  return buildQuizPrompt({ ...options, questionType: 'MIXED', topic, learnerContext: context })
}

/** Prompt for an AI-generated spaced-repetition quiz over the concepts due today. */
export function buildReviewPrompt(profile: LearnerProfile, options: PromptOptions, now: number = Date.now()): string {
  const due = selectDueConcepts(profile, now)
  const count = Math.max(5, Math.min(20, due.length + due.filter(d => d.status === 'weak').length))

  const context = `## Spaced Review

These concepts are due for review. Write one question per concept, and a second one for concepts marked weak.
Use new questions (never the classic textbook one), aim them at the listed misconceptions and missed points,
and mix recall with application. Keep each concept's original topic in mind.

${JSON.stringify({ due: due.map(describeConcept) }, null, 2)}
`
  return buildQuizPrompt({
    ...options,
    questionType: 'MIXED',
    count,
    topic: 'Spaced review of previously studied concepts',
    learnerContext: context
  })
}
