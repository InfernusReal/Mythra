import { NextResponse } from "next/server";

import { createTodayQueueService } from "../../../src/modules/queue/today-queue.service";

export async function GET() {
  const queueService = createTodayQueueService();
  const result = await queueService.getTodayQueue();

  return NextResponse.json(result, {
    status: result.ok ? 200 : 500
  });
}
