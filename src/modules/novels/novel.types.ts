export type NovelRecord = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateNovelInput = {
  title: string;
  description?: string;
};

export type NovelCreateErrorCode = "VALIDATION_ERROR" | "PERSISTENCE_ERROR";

export type NovelCreateError = {
  code: NovelCreateErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type NovelCreateSuccess = {
  ok: true;
  data: NovelRecord;
};

export type NovelCreateFailure = {
  ok: false;
  error: NovelCreateError;
};

export type NovelCreateResult = NovelCreateSuccess | NovelCreateFailure;

export interface NovelRepository {
  create(input: CreateNovelInput): Promise<NovelRecord>;
}
