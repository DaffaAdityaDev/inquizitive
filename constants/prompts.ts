export const PROMPT_TEMPLATES = {
  SCENARIO_BASED: (topic: string) => `
    Generate 10 multiple choice questions about "${topic}" based on:
    1. Real-world production failure scenarios
    2. Debugging challenges from actual codebases
    3. System design trade-offs in practice
    
    Each question should present a concrete scenario/problem, not abstract definitions.
    
    Example: Instead of "What is a race condition?", ask "Your e-commerce API returns incorrect inventory counts during flash sales. Which synchronization primitive should you use?"

    RETURN FORMAT:
    Return a raw JSON array (no markdown code blocks, just the array) with this structure:
    [
      {
        "q": "Question text here...",
        "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
        "answer": "Option A text", // IMPORTANT: Must match the option text EXACTLY
        "explanation": "Detailed explanation of why A is correct and others are wrong."
      }
    ]
  `,
  
  CONCEPT_DEEP_DIVE: (topic: string) => `
    Generate 10 conceptual multiple choice questions about "${topic}".
    Focus on "How it works under the hood" rather than syntax.
    
    RETURN FORMAT:
    Raw JSON array:
    [
      {
        "q": "...",
        "options": ["..."],
        "answer": "...", // Must match option text exactly
        "explanation": "..."
      }
    ]
  `
}
