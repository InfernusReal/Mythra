import { notFound } from "next/navigation";

import { MilestoneGraph } from "../../../../../src/components/milestones/milestone-graph";
import { PrismaMilestoneRepository } from "../../../../../src/modules/milestones/milestone.repository";
import { MilestoneService } from "../../../../../src/modules/milestones/milestone.service";

type VolumeMilestonesPageProps = {
  params: Promise<{
    volumeId: string;
  }>;
};

export default async function VolumeMilestonesPage({ params }: VolumeMilestonesPageProps) {
  const resolvedParams = await params;
  const milestoneService = new MilestoneService(new PrismaMilestoneRepository());
  const result = await milestoneService.getVolumeMilestones({
    volumeId: resolvedParams.volumeId
  });

  if (!result.ok) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor: "#f5f7fb"
      }}
    >
      <MilestoneGraph initialState={result.data} />
    </main>
  );
}
