type ReminderSchedule = {
  intervalDays: 1 | 2;
  nextReminderDueAt: Date;
};

type ReminderScheduleInput = {
  referenceDate: Date;
  missingFieldCount: number;
};

export function resolveReminderIntervalDays(missingFieldCount: number): 1 | 2 {
  return missingFieldCount >= 3 ? 1 : 2;
}

export function scheduleReminder(input: ReminderScheduleInput): ReminderSchedule {
  const intervalDays = resolveReminderIntervalDays(input.missingFieldCount);
  const nextReminderDueAt = new Date(input.referenceDate);

  nextReminderDueAt.setDate(nextReminderDueAt.getDate() + intervalDays);

  return {
    intervalDays,
    nextReminderDueAt
  };
}

export function shouldQueueReminder(nextReminderDueAt: Date | null, now: Date): boolean {
  if (!nextReminderDueAt) {
    return true;
  }

  return nextReminderDueAt.getTime() <= now.getTime();
}
