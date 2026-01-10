// lib/levelHelpers.ts
export const LEVEL_THRESHOLDS = [
  0,      // Level 1: 0-999 points
  1000,   // Level 2: 1000-1999 points
  2500,   // Level 3: 2500-3999 points
  5000,   // Level 4: 5000-7499 points
  10000,  // Level 5: 10000-14999 points
  20000,  // Level 6: 20000-29999 points
  35000,  // Level 7: 35000-49999 points
  50000,  // Level 8: 50000-74999 points
  75000,  // Level 9: 75000-99999 points
  100000  // Level 10: 100000+ points
];

export const LEVEL_NAMES = [
  'New Player',
  'Casual Gamer',
  'Regular Player',
  'Game Enthusiast',
  'Joy Champion',
  'Elite Player',
  'Master Player',
  'Grand Master',
  'Legend',
  'Legendary Joymaker'
];

export function calculateLevel(totalPoints: number): number {
  let level = 1;
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

export function getLevelProgress(totalPoints: number, currentLevel: number): {
  currentLevelPoints: number;
  nextLevelPoints: number;
  progressPercentage: number;
  pointsToNextLevel: number;
} {
  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  
  const pointsInCurrentLevel = totalPoints - currentLevelThreshold;
  const pointsNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
  const progressPercentage = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;
  const pointsToNextLevel = nextLevelThreshold - totalPoints;
  
  return {
    currentLevelPoints: currentLevelThreshold,
    nextLevelPoints: nextLevelThreshold,
    progressPercentage: Math.min(Math.max(progressPercentage, 0), 100),
    pointsToNextLevel: Math.max(pointsToNextLevel, 0)
  };
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level - 1] || LEVEL_NAMES[LEVEL_NAMES.length - 1];
}