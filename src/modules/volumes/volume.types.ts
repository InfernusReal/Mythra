export type VolumeRecord = {
  id: string;
  novelId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NovelSummary = {
  id: string;
  title: string;
};

export type VolumeWorkspaceRecord = {
  volume: VolumeRecord;
  novel: NovelSummary;
};

export type CreateVolumeInput = {
  novelId: string;
  title: string;
  description?: string;
};

export type VolumeCollection = {
  novel: NovelSummary;
  volumes: VolumeRecord[];
};

export type VolumeErrorCode = "VALIDATION_ERROR" | "NOVEL_NOT_FOUND" | "VOLUME_NOT_FOUND" | "PERSISTENCE_ERROR";

export type VolumeError = {
  code: VolumeErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type VolumeResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: VolumeError;
    };

export interface VolumeRepository {
  findNovelById(novelId: string): Promise<NovelSummary | null>;
  listByNovelId(novelId: string): Promise<VolumeRecord[]>;
  create(input: CreateVolumeInput): Promise<VolumeRecord>;
  findVolumeWorkspaceById(volumeId: string): Promise<VolumeWorkspaceRecord | null>;
}
