import Link from "next/link";
import { notFound } from "next/navigation";

import { PrismaMilestoneRepository } from "../../../../src/modules/milestones/milestone.repository";
import { MilestoneService } from "../../../../src/modules/milestones/milestone.service";

type MilestoneDetailPageProps = {
  params: Promise<{
    milestoneId: string;
  }>;
};

export default async function MilestoneDetailPage({ params }: MilestoneDetailPageProps) {
  const resolvedParams = await params;
  const milestoneService = new MilestoneService(new PrismaMilestoneRepository());
  const result = await milestoneService.getMilestoneDetail({
    milestoneId: resolvedParams.milestoneId
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
      <section
        style={{
          display: "grid",
          gap: "24px",
          backgroundColor: "#ffffff",
          border: "1px solid #d7dfeb",
          borderRadius: "20px",
          padding: "28px"
        }}
      >
        <header
          style={{
            display: "grid",
            gap: "8px"
          }}
        >
          <p style={{ margin: 0, color: "#607287", fontSize: "14px", fontWeight: 700, textTransform: "uppercase" }}>
            Milestone Detail
          </p>
          <h1 style={{ margin: 0, fontSize: "34px" }}>{result.data.milestone.title}</h1>
          <p style={{ margin: 0, color: "#52637a", lineHeight: 1.6 }}>
            This page proves milestone navigation is stable and that each milestone can resolve back to its parent
            volume before later scene and chapter phases begin.
          </p>
        </header>

        <section style={{ display: "grid", gap: "10px" }}>
          <strong>Parent volume</strong>
          <span>{result.data.volume.title}</span>
          <strong>Summary</strong>
          <span>{result.data.milestone.summary ?? "No milestone summary has been defined yet."}</span>
          <Link
            href={`/volumes/${result.data.volume.id}/milestones`}
            style={{ color: "#1a466f", fontWeight: 700, textDecoration: "none" }}
          >
            Return to milestone graph
          </Link>
        </section>
      </section>
    </main>
  );
}
