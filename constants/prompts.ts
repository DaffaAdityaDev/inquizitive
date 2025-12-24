// Advanced Prompt Templates with Cognitive Scaffolding
// Designed for maximum knowledge retention and neural pathway building

export interface QuestionConfig {
  questionCount: number;
  difficulty: 'intermediate' | 'advanced' | 'expert';
}

export const DEFAULT_CONFIG: QuestionConfig = {
  questionCount: 50,
  difficulty: 'expert'
};

export const PROMPT_TEMPLATES = {
  /**
   * SCENARIO-BASED: Real-world production scenarios
   * Best for: Practical application, debugging skills, system design
   */
  SCENARIO_BASED: (topic: string, config: QuestionConfig = DEFAULT_CONFIG) => `
You are an expert senior software engineer and technical interviewer with 15+ years of experience.
Generate exactly ${config.questionCount} multiple choice questions about "${topic}".

## CORE PRINCIPLES (MUST FOLLOW):

### 1. COGNITIVE SCAFFOLDING STRUCTURE
Organize questions into 5 progressive layers (${Math.floor(config.questionCount / 5)} questions each):

**Layer 1 - Foundation Anchors (Q1-${Math.floor(config.questionCount / 5)})**
- Core mental models that everything else builds upon
- "What happens under the hood when X occurs?"
- These become memory anchors for later questions

**Layer 2 - Mechanism Deep-Dive (Q${Math.floor(config.questionCount / 5) + 1}-${Math.floor(config.questionCount / 5) * 2})**
- Internal algorithms and data structures
- Questions should REFERENCE concepts from Layer 1
- "Given what you know about [Layer 1 concept], what happens when..."

**Layer 3 - Edge Cases & Failure Modes (Q${Math.floor(config.questionCount / 5) * 2 + 1}-${Math.floor(config.questionCount / 5) * 3})**
- Production failures, race conditions, memory leaks
- Must BUILD ON understanding from Layers 1-2
- "Your app using [Layer 2 mechanism] crashes when..."

**Layer 4 - Trade-offs & Architecture (Q${Math.floor(config.questionCount / 5) * 3 + 1}-${Math.floor(config.questionCount / 5) * 4})**
- System design decisions requiring holistic understanding
- SYNTHESIZE multiple concepts from previous layers
- "Considering [Layer 1] and [Layer 3], which approach..."

**Layer 5 - Expert Integration (Q${Math.floor(config.questionCount / 5) * 4 + 1}-${config.questionCount})**
- Complex scenarios requiring ALL previous knowledge
- Debugging production issues that span multiple systems
- "In a distributed system using [concepts from all layers]..."

### 2. QUESTION INTERCONNECTION RULES
- Each question MUST reference or build upon at least one previous concept
- Use phrases like: "Building on the concept of...", "Given that X (from Q3)...", "Considering the mechanism described earlier..."
- Create a KNOWLEDGE GRAPH, not isolated facts
- Later questions should be HARDER to answer without understanding earlier ones

### 3. DIFFICULTY CALIBRATION (${config.difficulty} level)
${config.difficulty === 'expert' ? `
- Assume reader is a senior developer
- Include obscure but critical internals
- Test nuanced understanding, not memorization
- Options should all seem plausible to someone who memorized docs
- Correct answer requires DEEP understanding` :
      config.difficulty === 'advanced' ? `
- Assume reader is a mid-level developer
- Focus on commonly misunderstood concepts
- Test practical application knowledge` :
        `- Assume reader is learning the topic
- Focus on foundational understanding
- Build confidence while teaching`}

### 4. ANTI-PATTERNS TO AVOID
❌ "What is X?" (definition questions)
❌ "Which syntax is correct?" (syntax questions)
❌ Questions answerable by reading first Google result
❌ Options that are obviously wrong
❌ Questions that don't connect to other questions
❌ Generic questions that could apply to any framework

### 5. QUESTION DESIGN PATTERNS TO USE
✅ "What happens internally when..." (mechanism)
✅ "Why does X behave this way instead of..." (reasoning)
✅ "Given this production error, what's the root cause..." (debugging)
✅ "Which approach optimizes for X while maintaining Y..." (trade-offs)
✅ "In what order does the runtime process..." (sequencing)
✅ "What's the performance implication of..." (consequences)

### 6. EXPLANATION REQUIREMENTS
Each explanation MUST include:
1. WHY the correct answer is right (mechanism-level)
2. WHY each wrong answer is wrong (common misconceptions)
3. CALLBACK to related earlier concepts when applicable
4. REAL-WORLD implication of misunderstanding this
5. MEMORY HOOK (analogy or mental model) to anchor the knowledge

## SCENARIO FOCUS
Generate questions based on:
1. **Production Incident Debugging** - "At 3am your pager goes off because..."
2. **Performance Optimization** - "Your app is slow because..."
3. **Security Vulnerabilities** - "Your security audit found..."
4. **Scalability Challenges** - "Your app works fine locally but in production..."
5. **Migration & Upgrade Issues** - "After upgrading from X to Y..."

RETURN FORMAT:
Return a raw JSON array (no markdown, no code blocks):
[
  {
    "q": "Question with concrete scenario...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A", // MUST match option text EXACTLY
    "explanation": "Comprehensive explanation with mechanism, misconceptions, callbacks, and memory hooks..."
  }
]
`,

  /**
   * CONCEPT-DEEP-DIVE: Under-the-hood understanding
   * Best for: Framework internals, runtime behavior, architecture
   */
  CONCEPT_DEEP_DIVE: (topic: string, config: QuestionConfig = DEFAULT_CONFIG) => `
You are a principal engineer who has contributed to "${topic}" source code.
Generate exactly ${config.questionCount} conceptual questions that test DEEP understanding.

## MISSION
Create questions that:
1. **Anchor knowledge** - Each concept becomes a memory hook for related concepts
2. **Build progressively** - Later questions require understanding earlier ones
3. **Maximize neural connections** - Every question bridges to multiple concepts
4. **Challenge experts** - Even senior devs should pause to think

## PROGRESSIVE KNOWLEDGE ARCHITECTURE

### Phase 1: Core Mental Models (Questions 1-${Math.floor(config.questionCount * 0.2)})
Establish foundational understanding that ALL later questions build upon:
- How does the runtime initialize "${topic}"?
- What data structures power the core functionality?
- What's the execution lifecycle?

### Phase 2: Internal Mechanisms (Questions ${Math.floor(config.questionCount * 0.2) + 1}-${Math.floor(config.questionCount * 0.4)})
Dive into HOW things work, referencing Phase 1:
- "Given the initialization process from Q2, what happens when..."
- Algorithm implementations
- State management internals

### Phase 3: Optimization & Performance (Questions ${Math.floor(config.questionCount * 0.4) + 1}-${Math.floor(config.questionCount * 0.6)})
Understand WHY design decisions were made:
- "Considering the mechanism in Q${Math.floor(config.questionCount * 0.25)}, why does..."
- Caching strategies
- Lazy evaluation patterns
- Memory management

### Phase 4: Edge Cases & Gotchas (Questions ${Math.floor(config.questionCount * 0.6) + 1}-${Math.floor(config.questionCount * 0.8)})
Test deep understanding through exceptions:
- "Despite what we learned about X, in case Y..."
- Race conditions
- Memory leaks
- Subtle bugs

### Phase 5: Mastery Integration (Questions ${Math.floor(config.questionCount * 0.8) + 1}-${config.questionCount})
Synthesize ALL previous knowledge:
- "Combining concepts from Phases 1-4..."
- Complex debugging scenarios
- Architecture decisions
- Performance tuning

## QUESTION INTERCONNECTION MATRIX
Each question must be TIGHTLY COUPLED to others:
- Reference specific earlier questions by concept
- Build chains of understanding
- Create "aha moments" when connections click

## DIFFICULTY: ${config.difficulty.toUpperCase()}
${config.difficulty === 'expert' ? `
All 4 options should be PLAUSIBLE to someone who:
- Has read the documentation
- Has used it in projects
- But hasn't read the source code

The CORRECT answer should only be obvious to someone who:
- Understands the internal implementation
- Has debugged complex issues
- Has contributed to or deeply studied the codebase` :
      config.difficulty === 'advanced' ? `
Options should challenge mid-level developers.
Correct answer requires practical experience.` :
        `Build understanding progressively.
Focus on consolidating fundamentals.`}

## QUESTION TEMPLATES
Use these patterns:
1. **Lifecycle**: "In what order does ${topic} process X, Y, Z?"
2. **Causation**: "Why does ${topic} use X instead of Y for Z?"
3. **Mechanism**: "What data structure does ${topic} use internally for X?"
4. **Consequence**: "What happens if X before Y completes?"
5. **Comparison**: "How does X differ from Y under the hood?"
6. **Debugging**: "Given this behavior, what internal state caused it?"
7. **Optimization**: "What's the Big-O complexity of X operation?"
8. **Trade-off**: "What did ${topic} sacrifice to achieve X?"

## EXPLANATION STRUCTURE (REQUIRED)
1. **Correct Answer Deep-Dive**: Technical explanation with source-code level detail
2. **Wrong Answer Analysis**: Why each is a common misconception
3. **Concept Bridges**: "This relates to Q[X] because..."
4. **Memory Anchor**: Provide an analogy or mental model
5. **Practical Impact**: How misunderstanding this causes real bugs

RETURN FORMAT:
Raw JSON array only (no markdown, no code blocks):
[
  {
    "q": "Under-the-hood conceptual question...",
    "options": ["Plausible A", "Plausible B", "Plausible C", "Plausible D"],
    "answer": "Plausible B", // EXACT match required
    "explanation": "Deep technical explanation with all 5 components..."
  }
]
`,

  /**
   * RAPID-FIRE: Quick knowledge validation
   * Best for: Interview prep, quick review, spaced repetition
   */
  RAPID_FIRE: (topic: string, config: QuestionConfig = DEFAULT_CONFIG) => `
Generate ${config.questionCount} rapid-fire questions about "${topic}" internals.

## PURPOSE
Create a knowledge validation quiz that:
1. Tests breadth AND depth quickly
2. Identifies knowledge gaps
3. Reinforces correct mental models
4. Chains concepts for spaced repetition

## QUESTION DISTRIBUTION
- 30% Core Mechanisms (how it works)
- 25% Common Pitfalls (what breaks)
- 20% Performance (why it's fast/slow)
- 15% Comparisons (vs alternatives)
- 10% Expert Edge Cases (the 1% cases)

## INTERCONNECTION REQUIREMENT
EVERY question must connect to at least 2 others:
- Forward references: "This relates to upcoming Q on..."
- Backward references: "Building on earlier concept..."
- Create a web of knowledge, not linear facts

## DIFFICULTY: ${config.difficulty.toUpperCase()}
Make it CHALLENGING. The goal is learning, not confidence boosting.

RETURN FORMAT:
Raw JSON array:
[
  {
    "q": "Concise but deep question...",
    "options": ["A", "B", "C", "D"],
    "answer": "A", // Exact match
    "explanation": "Brief but insightful explanation with concept links..."
  }
]
`,

  /**
   * DEBUGGING-MASTERY: Production debugging scenarios
   * Best for: Debugging skills, production readiness, incident response
   */
  DEBUGGING_MASTERY: (topic: string, config: QuestionConfig = DEFAULT_CONFIG) => `
You are a Staff Engineer who has debugged 1000+ production incidents involving "${topic}".
Generate ${config.questionCount} debugging scenario questions.

## SCENARIO STRUCTURE
Each question presents:
1. **The Symptom** - What the developer observes
2. **The Context** - Tech stack, scale, recent changes
3. **The Question** - What's the root cause / next debug step

## PROGRESSIVE DEBUGGING JOURNEY
Structure questions as an escalating debugging journey:

**Level 1 (Q1-${Math.floor(config.questionCount * 0.2)}): Common Issues**
- Stack traces and error messages
- Configuration mistakes
- Basic misunderstandings

**Level 2 (Q${Math.floor(config.questionCount * 0.2) + 1}-${Math.floor(config.questionCount * 0.4)}): Intermediate Debugging**
- Race conditions
- Memory leaks (building on internal understanding from Level 1)
- State management bugs

**Level 3 (Q${Math.floor(config.questionCount * 0.4) + 1}-${Math.floor(config.questionCount * 0.6)}): Complex Interactions**
- Multi-system issues
- Timing-dependent bugs
- Questions reference mechanisms from Levels 1-2

**Level 4 (Q${Math.floor(config.questionCount * 0.6) + 1}-${Math.floor(config.questionCount * 0.8)}): Production-Only Bugs**
- Works locally, fails in production
- Scale-dependent issues
- Environment-specific behavior

**Level 5 (Q${Math.floor(config.questionCount * 0.8) + 1}-${config.questionCount}): Nightmare Scenarios**
- Heisenberg bugs (changes when observed)
- Intermittent failures
- Requires synthesizing ALL previous knowledge

## INTERCONNECTION WEB
Each debugging scenario should:
- Build on understanding from previous questions
- Teach a concept that helps solve later questions
- Reference: "Given what we know about [earlier concept]..."

## EXPLANATION REQUIREMENTS
For each explanation:
1. **Root Cause**: Technical deep-dive
2. **Debugging Path**: How to identify this
3. **Prevention**: How to avoid in future
4. **Connection**: Links to other questions
5. **War Story**: Brief real-world context

RETURN FORMAT:
Raw JSON array:
[
  {
    "q": "3am pager scenario...",
    "options": ["Root cause A", "Root cause B", "Root cause C", "Root cause D"],
    "answer": "Root cause B", // Exact match
    "explanation": "Full debugging walkthrough..."
  }
]
`
};
