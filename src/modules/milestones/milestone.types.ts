export type MilestoneRecord = {
  id: string;
  volumeId: string;
  title: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VolumeSummary = {
  id: string;
  title: string;
};

export type MilestoneGraphCollection = {
  volume: VolumeSummary;
  milestones: MilestoneRecord[];
};

export type MilestoneDetailRecord = {
  milestone: MilestoneRecord;
  volume: VolumeSummary;
};

export type CreateMilestoneInput = {
  volumeId: string;
  title: string;
  summary?: string;
};

export type MilestoneErrorCode =
  | "VALIDATION_ERROR"
  | "VOLUME_NOT_FOUND"
  | "MILESTONE_NOT_FOUND"
  | "PERSISTENCE_ERROR";

export type MilestoneError = {
  code: MilestoneErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type MilestoneResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: MilestoneError;
    };

export interface MilestoneRepository {
  findVolumeById(volumeId: string): Promise<VolumeSummary | null>;
  listByVolumeId(volumeId: string): Promise<MilestoneRecord[]>;
  create(input: CreateMilestoneInput): Promise<MilestoneRecord>;
  findMilestoneDetailById(milestoneId: string): Promise<MilestoneDetailRecord | null>;
}
