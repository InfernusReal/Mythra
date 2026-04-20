export type LocalDraftRecord = {
  chapterId: string;
  body: string;
  savedVersion: number;
  wordCount: number;
  updatedAt: string;
};

function buildLocalDraftKey(chapterId: string): string {
  return `mythra:chapter-draft:${chapterId}`;
}

export function loadLocalDraft(chapterId: string): LocalDraftRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedDraft = window.localStorage.getItem(buildLocalDraftKey(chapterId));

    if (!storedDraft) {
      return null;
    }

    return JSON.parse(storedDraft) as LocalDraftRecord;
  } catch {
    return null;
  }
}

export function persistLocalDraft(record: LocalDraftRecord): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(buildLocalDraftKey(record.chapterId), JSON.stringify(record));
  } catch {
    // Section: Ignore storage write failures and keep the editor usable
  }
}

export function clearLocalDraft(chapterId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(buildLocalDraftKey(chapterId));
  } catch {
    // Section: Ignore storage cleanup failures and keep the editor usable
  }
}
