import Link from "next/link";

import type { MilestoneRecord } from "../../modules/milestones/milestone.types";

type MilestoneCardProps = {
  milestone: MilestoneRecord;
};

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  return (
    <Link
      href={`/milestones/${milestone.id}`}
      style={{
        display: "grid",
        gap: "6px",
        minHeight: "148px",
        padding: "20px",
        borderRadius: "18px",
        border: "1px solid #d7dfeb",
        backgroundColor: "#ffffff",
        textDecoration: "none",
        color: "#132238",
        boxShadow: "0 18px 36px rgba(19, 34, 56, 0.06)"
      }}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#607287"
        }}
      >
        Milestone
      </span>
      <strong style={{ fontSize: "20px" }}>{milestone.title}</strong>
      <span style={{ color: "#607287", fontSize: "13px" }}>
        Chapter cap: {milestone.maxChaptersPerMilestone ?? "Not set"}
      </span>
      <span style={{ color: "#52637a", lineHeight: 1.6 }}>
        {milestone.summary ?? "No milestone summary has been defined yet."}
      </span>
    </Link>
  );
}
