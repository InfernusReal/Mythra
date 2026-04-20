"use client";

import { useEffect, useState } from "react";

import type { ChapterGuidanceRecord, ChapterGuidanceResult } from "../../modules/chapters/chapter-guidance.types";
import { NextSceneSuggestion } from "./next-scene-suggestion";

type ChapterGuidanceStripProps = {
  chapterId: string | null;
  refreshKey: string;
};

export function ChapterGuidanceStrip({ chapterId, refreshKey }: ChapterGuidanceStripProps) {
  const [guidance, setGuidance] = useState<ChapterGuidanceRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState("Guidance ready.");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!chapterId) {
      setGuidance(null);
      setStatusMessage("Guidance becomes available after the chapter loads.");
      return;
    }

    let isCancelled = false;

    async function loadGuidance() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/chapters/${chapterId}/guidance`, {
          method: "GET"
        });
        const result = (await response.json()) as ChapterGuidanceResult;

        if (isCancelled) {
          return;
        }

        if (!result.ok) {
          setGuidance(null);
          setStatusMessage(result.error.message);
          return;
        }

        setGuidance(result.data);
        setStatusMessage("Passive guidance updated.");
      } catch {
        if (!isCancelled) {
          setGuidance(null);
          setStatusMessage("Guidance is temporarily unavailable.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadGuidance();

    return () => {
      isCancelled = true;
    };
  }, [chapterId, refreshKey]);

  if (!chapterId) {
    return null;
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "14px"
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "14px",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 360px)"
        }}
      >
        <article
          style={{
            borderRadius: "24px",
            border: "1px solid #d7dfeb",
            backgroundColor: "#ffffff",
            padding: "20px",
            display: "grid",
            gap: "14px"
          }}
        >
          <div style={{ display: "grid", gap: "6px" }}>
            <strong style={{ color: "#132238", fontSize: "18px" }}>Flow guidance</strong>
            <span style={{ color: "#52637a", lineHeight: 1.6 }}>
              Guidance stays visible, but it does not interrupt the writing surface.
            </span>
          </div>

          {guidance?.indicators.length ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              {guidance.indicators.map((indicator) => (
                <div
                  key={indicator.code}
                  style={{
                    minWidth: "220px",
                    flex: "1 1 220px",
                    borderRadius: "18px",
                    border: indicator.severity === "WARNING" ? "1px solid #e3c28d" : "1px solid #bfd5ee",
                    backgroundColor: indicator.severity === "WARNING" ? "#fff8ee" : "#f3f8ff",
                    padding: "14px",
                    display: "grid",
                    gap: "6px"
                  }}
                >
                  <span
                    style={{
                      color: indicator.severity === "WARNING" ? "#8f5b12" : "#1a466f",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase"
                    }}
                  >
                    {indicator.title}
                  </span>
                  <strong style={{ color: "#132238" }}>{indicator.count}</strong>
                  <span style={{ color: "#52637a", lineHeight: 1.5 }}>{indicator.description}</span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                borderRadius: "18px",
                border: "1px solid #bfd5ee",
                backgroundColor: "#f3f8ff",
                padding: "14px",
                color: "#1a466f"
              }}
            >
              No passive pressure indicators are active for this milestone right now.
            </div>
          )}

          <div
            style={{
              borderRadius: "18px",
              border: "1px solid #d7dfeb",
              backgroundColor: "#f8fafc",
              padding: "14px",
              display: "grid",
              gap: "6px"
            }}
          >
            <strong style={{ color: "#132238" }}>End-of-session summary</strong>
            <span style={{ color: "#52637a", lineHeight: 1.6 }}>
              {guidance?.progressSummary.summaryLabel ?? "Milestone progress will appear here once guidance loads."}
            </span>
            {guidance?.progressSummary ? (
              <span style={{ color: "#607287", fontSize: "13px" }}>
                {guidance.progressSummary.remainingScenes} scenes still need chapter coverage.
              </span>
            ) : null}
          </div>
        </article>

        <NextSceneSuggestion suggestion={guidance?.nextSceneSuggestion ?? null} />
      </div>

      <span style={{ color: "#607287", fontSize: "13px" }}>
        {isLoading ? "Refreshing guidance..." : statusMessage}
      </span>
    </section>
  );
}
