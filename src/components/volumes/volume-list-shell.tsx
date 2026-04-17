"use client";

import Link from "next/link";
import { useState } from "react";

import type { VolumeCollection, VolumeWorkspaceRecord } from "../../modules/volumes/volume.types";

type VolumeListShellProps = {
  initialState: VolumeCollection;
};

type CreateVolumeResponse =
  | {
      ok: true;
      data: VolumeWorkspaceRecord;
    }
  | {
      ok: false;
      error: {
        message: string;
      };
    };

export function VolumeListShell({ initialState }: VolumeListShellProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [volumes, setVolumes] = useState(initialState.volumes);
  const [statusMessage, setStatusMessage] = useState("Create the next volume for this novel.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateVolume() {
    setIsSubmitting(true);
    setStatusMessage("Creating volume...");

    try {
      const response = await fetch("/api/volumes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          novelId: initialState.novel.id,
          title,
          description
        })
      });

      const result = (await response.json()) as CreateVolumeResponse;

      if (!result.ok) {
        setStatusMessage(result.error.message);
        setIsSubmitting(false);
        return;
      }

      setVolumes((currentVolumes) => [...currentVolumes, result.data.volume]);
      setTitle("");
      setDescription("");
      setStatusMessage(`Volume created: ${result.data.volume.title}`);
      setIsSubmitting(false);
    } catch {
      setStatusMessage("The volume could not be created right now. Please retry.");
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
          Novel
        </p>
        <h1 style={{ margin: 0, fontSize: "32px" }}>{initialState.novel.title}</h1>
        <p style={{ margin: 0, color: "#52637a", lineHeight: 1.6 }}>
          Volumes anchor milestones and world-building. This workspace keeps the parent novel lookup explicit and
          stable.
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
        <h2 style={{ margin: 0, fontSize: "20px" }}>Create Volume</h2>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Volume title"
          style={{
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid #c1ccdd",
            fontSize: "16px"
          }}
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional summary for this volume"
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
          onClick={handleCreateVolume}
          disabled={isSubmitting}
          style={{
            border: "none",
            borderRadius: "999px",
            backgroundColor: "#153a61",
            color: "#ffffff",
            padding: "14px 20px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? "Creating..." : "Create Volume"}
        </button>
        <p style={{ margin: 0, color: "#52637a" }}>{statusMessage}</p>
      </section>

      <section
        style={{
          display: "grid",
          gap: "12px"
        }}
      >
        <h2 style={{ margin: 0, fontSize: "20px" }}>Volume List</h2>
        {volumes.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px dashed #c4d1e5",
              borderRadius: "18px",
              padding: "20px",
              color: "#607287"
            }}
          >
            No volumes exist yet for this novel.
          </div>
        ) : (
          volumes.map((volume) => (
            <Link
              key={volume.id}
              href={`/volumes/${volume.id}`}
              style={{
                display: "grid",
                gap: "4px",
                textDecoration: "none",
                backgroundColor: "#ffffff",
                border: "1px solid #d7dfeb",
                borderRadius: "18px",
                padding: "20px",
                color: "#132238"
              }}
            >
              <strong>{volume.title}</strong>
              <span style={{ color: "#607287" }}>{volume.description ?? "No description provided yet."}</span>
            </Link>
          ))
        )}
      </section>
    </section>
  );
}
