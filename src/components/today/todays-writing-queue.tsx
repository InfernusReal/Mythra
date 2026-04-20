import { ContinueWritingCard } from "./continue-writing-card";
import type { TodayQueueRecord } from "../../modules/queue/today-queue.types";

type TodaysWritingQueueProps = {
  queue: TodayQueueRecord;
};

export function TodaysWritingQueue({ queue }: TodaysWritingQueueProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "24px"
      }}
    >
      <header
        style={{
          display: "grid",
          gap: "8px"
        }}
      >
        <p style={{ margin: 0, color: "#607287", fontSize: "14px", fontWeight: 700, textTransform: "uppercase" }}>
          Daily Writing Entry
        </p>
        <h1 style={{ margin: 0, fontSize: "34px" }}>{queue.queueLabel}</h1>
        <p style={{ margin: 0, color: "#52637a", lineHeight: 1.6 }}>
          Open Mythra and move directly into the next available writing target without navigating through planning
          systems first.
        </p>
      </header>

      <ContinueWritingCard target={queue.continueTarget} />

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
        <h2 style={{ margin: 0, fontSize: "22px" }}>Next Scenes To Write</h2>
        {queue.nextScenes.length === 0 ? (
          <p style={{ margin: 0, color: "#607287" }}>
            {queue.emptyStateMessage ?? "No linked scenes are ready for the active chapter yet."}
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "10px"
            }}
          >
            {queue.nextScenes.map((scene) => (
              <div
                key={scene.sceneId}
                style={{
                  borderRadius: "14px",
                  backgroundColor: "#f5f7fb",
                  padding: "14px 16px",
                  color: "#132238"
                }}
              >
                {scene.sortOrder}. {scene.outline}
              </div>
            ))}
          </div>
        )}
      </section>

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
        <h2 style={{ margin: 0, fontSize: "22px" }}>Current Milestone Progress</h2>
        {queue.milestoneProgress === null ? (
          <p style={{ margin: 0, color: "#607287" }}>
            Progress will appear here after an active chapter and milestone context exist.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "8px"
            }}
          >
            <strong style={{ fontSize: "18px" }}>{queue.milestoneProgress.milestoneTitle}</strong>
            <span style={{ color: "#52637a" }}>{queue.milestoneProgress.progressLabel}</span>
            <span style={{ color: "#52637a" }}>Remaining scenes: {queue.milestoneProgress.remainingScenes}</span>
            <span style={{ color: "#52637a" }}>Chapters created: {queue.milestoneProgress.chapterCount}</span>
          </div>
        )}
      </section>
    </section>
  );
}
