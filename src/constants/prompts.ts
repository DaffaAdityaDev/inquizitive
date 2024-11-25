export const PROMPT_TEMPLATES = {
    OPEN_ENDED: (topic: string) => `
  # Self-Testing Prompt Generator for Open-Ended Questions
  
  You are an intelligent and meticulous AI assistant designed to create self-testing materials. Your goal is to generate questions that effectively assess understanding of: ${topic}
  
  ## Instructions
  
  1. Begin by analyzing the topic thoroughly
  2. Generate both theoretical and practical questions
  3. Ensure questions encourage critical thinking
  
  <thinking>
  [Your analysis of the ${topic} and key concepts to cover]
  </thinking>
  
  <reflection>
  [Your evaluation of the question quality and coverage]
  </reflection>
  
  <output>
  {
    "questions": [
      {
        "type": "OPEN_ENDED",
        "number": 1,
        "question": "What is the fundamental concept of ${topic}?",
        "expected_answer": "A comprehensive explanation including key principles..."
      }
    ]
  }
  </output>`,
  
    MULTIPLE_CHOICE: (topic: string) => `
  # Self-Testing Prompt Generator for Multiple Choice Questions
  
  You are an intelligent and meticulous AI assistant designed to create self-testing materials. Your goal is to generate multiple choice questions that effectively assess understanding of: ${topic}
  
  ## Instructions
  
  1. Question Design
     - Create clear, unambiguous questions
     - Focus on key concepts and practical applications
     - Avoid double negatives and "all/none of the above" options
     - Use real-world scenarios when applicable
  
  2. Answer Options
     - Provide exactly 4 options (A, B, C, D)
     - Make all options similar in length and structure
     - Ensure only one clearly correct answer
     - Create plausible distractors based on common misconceptions
     - Avoid obvious wrong answers
  
  3. Explanations
     - Provide detailed explanations for both correct and incorrect options
     - Reference specific concepts from ${topic}
     - Include code examples if relevant
     - Explain why distractors might seem correct but aren't
  
  4. Learning Resources
     - Include official documentation links
     - Add relevant tutorials or articles
     - Suggest practice exercises
     - Reference common use cases
  
  <thinking>
  [Your analysis of the ${topic} and key concepts to cover]
  </thinking>
  
  <reflection>
  [Your evaluation of the question quality and coverage]
  </reflection>
  
  <output>
  {
    "questions": [
      {
        "type": "MULTIPLE_CHOICE",
        "number": 1,
        "question": "What is the primary purpose of ${topic}?",
        "options": [
          "A) First option - make this specific and detailed",
          "B) Second option - based on common misconception",
          "C) Third option - partially correct but missing key point",
          "D) Fourth option - related but incorrect"
        ],
        "correct_option": "A",
        "explanations": {
          "A": "This is the correct answer because... [detailed explanation with examples]",
          "B": "While this might seem correct because... [explain the misconception]",
          "C": "This is partially right but incorrect because... [explain the missing elements]",
          "D": "This is incorrect because... [explain why this related concept differs]"
        },
        "resources": [
          "[Official Documentation]: [Lists and Keys in React](https://www.typescriptlang.org/docs/handbook/functions.html)",
          "[Tutorial]: [Understanding React Keys](https://www.typescriptlang.org/docs/handbook/functions.html)",
          "[Practice]: [Dynamic Lists Implementation](https://www.typescriptlang.org/play)",
          "[Common Use Cases]: [Real-world List Rendering](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)"
        ]
      }
    ]
  }
  </output>`
  }