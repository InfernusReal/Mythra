"use client";

import { useState } from "react";

import type { MilestoneDetailRecord, MilestoneGraphCollection } from "../../modules/milestones/milestone.types";
import { MilestoneCard } from "./milestone-card";

type MilestoneGraphProps = {
  initialState: MilestoneGraphCollection;
};

type CreateMilestoneResponse =
  | {
      ok: true;
      data: MilestoneDetailRecord;
    }
  | {
      ok: false;
      error: {
        message: string;
      };
    };

export function MilestoneGraph({ initialState }: MilestoneGraphProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [milestones, setMilestones] = useState(initialState.milestones);
  const [statusMessage, setStatusMessage] = useState("Create the next milestone card for this volume.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateMilestone() {
    setIsSubmitting(true);
    setStatusMessage("Creating milestone...");

    try {
      const response = await fetch("/api/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          volumeId: initialState.volume.id,
          title,
          summary
        })
      });

      const result = (await response.json()) as CreateMilestoneResponse;

      if (!result.ok) {
        setStatusMessage(result.error.message);
        setIsSubmitting(false);
        return;
      }

      setMilestones((currentMilestones) => [...currentMilestones, result.data.milestone]);
      setTitle("");
      setSummary("");
      setStatusMessage(`Milestone created: ${result.data.milestone.title}`);
      setIsSubmitting(false);
    } catch {
      setStatusMessage("The milestone could not be created right now. Please retry.");
      setIsSubmitting(false);
    }
  }

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
          Volume
        </p>
        <h1 style={{ margin: 0, fontSize: "32px" }}>{initialState.volume.title}</h1>
        <p style={{ margin: 0, color: "#52637a", lineHeight: 1.6 }}>
          Milestones stay in the planning layer. They are presented here as clickable graph cards, not as the main
          daily writing surface.
        </p>
      </header>

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
        <h2 style={{ margin: 0, fontSize: "20px" }}>Create Milestone</h2>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Milestone title"
          style={{
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid #c1ccdd",
            fontSize: "16px"
          }}
        />
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Optional milestone summary"
          rows={4}
          style={{
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid #c1ccdd",
            fontSize: "16px",
            resize: "vertical"
          }}
        />
        <button
          type="button"
          onClick={handleCreateMilestone}
          disabled={isSubmitting}
          style={{
            border: "none",
            borderRadius: "999px",
            backgroundColor: "#1a466f",
            color: "#ffffff",
            padding: "14px 20px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? "Creating..." : "Create Milestone"}
        </button>
        <p style={{ margin: 0, color: "#52637a" }}>{statusMessage}</p>
      </section>

      <section
        style={{
          display: "grid",
          gap: "16px"
        }}
      >
        <h2 style={{ margin: 0, fontSize: "20px" }}>Milestone Graph</h2>
        {milestones.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px dashed #c4d1e5",
              borderRadius: "18px",
              padding: "20px",
              color: "#607287"
            }}
          >
            No milestones exist yet for this volume.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px"
            }}
          >
            {milestones.map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
