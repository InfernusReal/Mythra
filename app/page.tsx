import { TodaysWritingQueue } from "../src/components/today/todays-writing-queue";
import { createTodayQueueService } from "../src/modules/queue/today-queue.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const queueService = createTodayQueueService();
  const result = await queueService.getTodayQueue();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor: "#f5f7fb"
      }}
    >
      {result.ok ? (
        <TodaysWritingQueue queue={result.data} />
      ) : (
        <section
          style={{
            display: "grid",
            gap: "12px",
            backgroundColor: "#ffffff",
            border: "1px solid #d7dfeb",
            borderRadius: "18px",
            padding: "24px",
            color: "#132238"
          }}
        >
          <h1 style={{ margin: 0, fontSize: "32px" }}>Today's Writing Queue</h1>
          <p style={{ margin: 0, color: "#52637a" }}>{result.error.message}</p>
        </section>
      )}
    </main>
  );
}
