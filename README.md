# Inquizitive

Inquizitive turns any free web AI chat (ChatGPT, Gemini, Claude, ...) into a study partner.
It writes the prompts for you, runs the quiz, grades what it can locally, and keeps
re-quizzing you on the questions you have not mastered yet.

There are no API keys and no AI calls from the app. You copy prompts into the AI chat of
your choice and paste its answers back. Everything stays in your browser.

## How it works

1. **Pick a topic and set up the prompt.** Choose the question type (open-ended, multiple
   choice or mixed), the number of questions (5, 10, 15 or 20), the difficulty (beginner,
   intermediate or advanced) and the language (English or Bahasa Indonesia). You can also
   paste optional source material so the questions are based only on it. Then copy the
   generated prompt. Your choices are remembered for next time (source material is not saved).
2. **Ask your AI.** Paste the prompt into a free web AI chat. It replies with the quiz as JSON.
3. **Paste the questions back.** Inquizitive finds the JSON in the reply, whether it sits in
   `<output>` tags, a ```` ```json ```` block, or plain text with chatter around it. It also
   fixes the usual chat damage such as smart quotes and trailing commas. Press
   **Ctrl/Cmd + Enter** to start.
4. **Answer the quiz.** Multiple-choice answers are graded instantly in the browser.
5. **Get open-ended answers evaluated.** If the round has open-ended questions, copy the
   evaluation prompt (it only includes those questions), paste it into the AI chat, and
   paste the JSON feedback back. Each answer gets a 0-100 score and an explanation.
6. **Retry failed.** Questions scoring below 85 come back in the next round until every
   question is mastered.

## Features

- **Copy-paste workflow:** works with any free web AI chat, with no accounts or keys.
- **Local MCQ grading:** answers are matched by letter (`B`, `B)`, `B.`) or full option text.
  The AI is never asked to grade multiple choice, and MCQ items in pasted feedback are ignored.
- **Mastery loop:** each question keeps its best score and attempt count. A question is
  mastered at a score of 85 or more.
- **Rounds:** **Retry Failed** starts a new round with only the unmastered questions. If the
  round has open-ended questions, you need to paste their AI feedback before you can retry.
- **Safe feedback pasting:** pasting the same feedback twice does nothing, pasting an updated
  evaluation for the same round replaces the earlier one instead of counting another attempt,
  and the previous round's feedback is rejected. Only this round's open-ended questions are
  read from the reply. Invalid feedback shows an error without being saved.
- **Persistence:** the whole session (questions, answers, feedback, mastery, round) is stored in
  `localStorage`, so a reload continues where you left off. **Quit to home**,
  **Start New Topic** and **Start Fresh** clear it (each asks for confirmation first).
- **Code mode:** a code-friendly answer editor for programming questions.

## Development

Requires Node 18+.

```bash
npm install
npm run dev        # start the Vite dev server
npm run build      # type-check (tsc -b) and build for production
npm run preview    # serve the production build
npm run lint       # eslint
npx vitest run     # run the unit tests once (npm test starts watch mode)
```

### Project layout

```
src/
  features/
    quiz/        # quiz session reducer, storage, question parsing, MCQ grading, views
    feedback/    # AI feedback parsing, evaluation prompt, feedback display
    mastery/     # grade parsing and mastery updates
    prompts/     # base prompt templates and question-type selection
  shared/        # shared types and components
```

Built with React 18, TypeScript, Vite, NextUI, Tailwind CSS and framer-motion. Tests use Vitest.
