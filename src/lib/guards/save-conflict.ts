export type SaveConflictEvaluation = {
  hasConflict: boolean;
  reason: "STALE_VERSION" | "NO_CONFLICT";
};

export function evaluateSaveConflict(input: {
  expectedSavedVersion: number;
  currentSavedVersion: number;
}): SaveConflictEvaluation {
  if (input.expectedSavedVersion !== input.currentSavedVersion) {
    return {
      hasConflict: true,
      reason: "STALE_VERSION"
    };
  }

  return {
    hasConflict: false,
    reason: "NO_CONFLICT"
  };
}
