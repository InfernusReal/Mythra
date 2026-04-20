import { NextResponse } from "next/server";

import { milestoneRulesParamsSchema } from "../../../../../src/modules/milestones/milestone-rules.schema";
import { MilestoneCompletionService } from "../../../../../src/modules/milestones/milestone-completion.service";
import { PrismaMilestoneRepository } from "../../../../../src/modules/milestones/milestone.repository";
import { MilestoneRulesService } from "../../../../../src/modules/milestones/milestone-rules.service";

const milestoneRulesService = new MilestoneRulesService(
  new PrismaMilestoneRepository(),
  new MilestoneCompletionService()
);

type MilestoneRulesRouteProps = {
  params: Promise<{
    milestoneId: string;
  }>;
};

export async function POST(request: Request, context: MilestoneRulesRouteProps) {
  const params = await context.params;
  const parsedParams = milestoneRulesParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Milestone id is invalid.",
          fieldErrors: parsedParams.error.flatten().fieldErrors
        }
      },
      { status: 400 }
    );
  }

  try {
    const payload = await request.json();
    const result = await milestoneRulesService.evaluateRules(parsedParams.data.milestoneId, payload);
    const statusCode =
      !result.ok && result.error.code === "MILESTONE_NOT_FOUND"
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
          message: "Unable to evaluate milestone rules right now."
        }
      },
      { status: 500 }
    );
  }
}
