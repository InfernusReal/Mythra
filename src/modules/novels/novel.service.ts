import { logError, logInfo, logWarn } from "../../lib/observability/console-logger";
import { createNovelSchema } from "./novel.schema";
import type { NovelCreateResult, NovelRepository } from "./novel.types";

export class NovelService {
  constructor(private readonly repository: NovelRepository) {}

  async createNovel(payload: unknown): Promise<NovelCreateResult> {
    const parsedPayload = createNovelSchema.safeParse(payload);

    if (!parsedPayload.success) {
      logWarn("[P01][NovelCreate] Validation failed", {
        fieldErrors: parsedPayload.error.flatten().fieldErrors
      }); // SAFETY_LOG:P01_NOVEL_CREATE_VALIDATION_FAILED

      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Novel details are invalid.",
          fieldErrors: parsedPayload.error.flatten().fieldErrors
        }
      };
    }

    logInfo("[P01][NovelCreate] Validation passed", {
      titleLength: parsedPayload.data.title.length
    }); // SAFETY_LOG:P01_NOVEL_CREATE_VALIDATED

    try {
      logInfo("[P01][NovelCreate] Database write starting", {
        title: parsedPayload.data.title
      }); // SAFETY_LOG:P01_NOVEL_CREATE_DB_START

      const createdNovel = await this.repository.create(parsedPayload.data);

      logInfo("[P01][NovelCreate] Database write succeeded", {
        novelId: createdNovel.id
      }); // SAFETY_LOG:P01_NOVEL_CREATE_DB_SUCCESS

      return {
        ok: true,
        data: createdNovel
      };
    } catch (error) {
      logError("[P01][NovelCreate] Returning safe fallback", {
        error: error instanceof Error ? error.message : "Unknown error"
      }); // SAFETY_LOG:P01_NOVEL_CREATE_FALLBACK

      return {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to create the novel right now."
        }
      };
    }
  }
}
