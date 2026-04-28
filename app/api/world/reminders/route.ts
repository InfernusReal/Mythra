import { NextResponse } from "next/server";

import { WorldReminderService } from "../../../../src/modules/world-building/world-reminder.service";
import { PrismaWorldRepository } from "../../../../src/modules/world-building/world.repository";

const worldReminderService = new WorldReminderService(new PrismaWorldRepository());

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await worldReminderService.queueIncompleteNodeReminders(payload);
    const statusCode =
      !result.ok && result.error.code === "VOLUME_NOT_FOUND"
        ? 404
        : !result.ok && result.error.code === "VALIDATION_ERROR"
          ? 400
          : !result.ok
            ? 500
            : 200;

    return NextResponse.json(result, { status: statusCode });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PERSISTENCE_ERROR",
          message: "Unable to queue world-node reminders right now."
        }
      },
      { status: 500 }
    );
  }
}
