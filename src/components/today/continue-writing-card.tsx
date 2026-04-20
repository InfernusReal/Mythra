import Link from "next/link";

import type { TodayQueueContinueTarget } from "../../modules/queue/today-queue.types";

type ContinueWritingCardProps = {
  target: TodayQueueContinueTarget | null;
};

export function ContinueWritingCard({ target }: ContinueWritingCardProps) {
  if (!target) {
    return (
      <section
        style={{
          display: "grid",
          gap: "10px",
          backgroundColor: "#ffffff",
          border: "1px dashed #c4d1e5",
          borderRadius: "18px",
          padding: "24px"
        }}
      >
        <h2 style={{ margin: 0, fontSize: "22px" }}>Continue Writing</h2>
        <p style={{ margin: 0, color: "#52637a", lineHeight: 1.6 }}>
          The queue will appear here after a chapter exists and scenes are linked into it.
        </p>
      </section>
    );
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "12px",
        backgroundColor: "#ffffff",
        border: "1px solid #d7dfeb",
        borderRadius: "18px",
        padding: "24px"
      }}
    >
      <p style={{ margin: 0, color: "#607287", fontSize: "14px", fontWeight: 700, textTransform: "uppercase" }}>
        Continue Writing
      </p>
      <h2 style={{ margin: 0, fontSize: "24px" }}>{target.chapterTitle}</h2>
      <p style={{ margin: 0, color: "#52637a", lineHeight: 1.6 }}>
        Resume in {target.milestoneTitle} within {target.volumeTitle}.
      </p>
      <Link
        href={target.href}
        style={{
          width: "fit-content",
          borderRadius: "999px",
          backgroundColor: "#1a466f",
          color: "#ffffff",
          padding: "14px 20px",
          fontSize: "16px",
          fontWeight: 700,
          textDecoration: "none"
        }}
      >
        Continue Writing
      </Link>
    </section>
  );
}
