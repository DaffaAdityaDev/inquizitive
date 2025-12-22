export interface SRSItem {
  interval: number; // Days
  repetition: number; // Count
  easeFactor: number; // Multiplier
}

export function calculateSRS(current: SRSItem, grade: number): SRSItem {
  let newInterval: number;
  let newRepetition: number;
  let newEaseFactor: number;

  if (grade < 3) {
    // Again/Fail (Grade 0-2) -> Reset
    newRepetition = 0;
    newInterval = 1; // Review again tomorrow
    newEaseFactor = current.easeFactor; // Ease factor stays same
  } else {
    // Success
    newEaseFactor = current.easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3; // Minimum floor

    newRepetition = current.repetition + 1;

    // Calculate Interval (Days)
    if (newRepetition === 1) {
      newInterval = 1;
    } else if (newRepetition === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(current.interval * newEaseFactor);
    }
  }

  return { 
    interval: newInterval, 
    repetition: newRepetition, 
    easeFactor: newEaseFactor 
  };
}
