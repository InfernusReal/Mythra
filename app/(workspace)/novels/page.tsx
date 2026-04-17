"use client";

import { FormEvent, useState } from "react";

type CreateNovelResponse =
  | {
      ok: true;
      data: {
        id: string;
        title: string;
      };
    }
  | {
      ok: false;
      error: {
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

export default function NovelsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusMessage, setStatusMessage] = useState("Create the root novel record.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("Creating novel...");

    try {
      const response = await fetch("/api/novels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description
        })
      });

      const result = (await response.json()) as CreateNovelResponse;

      if (!result.ok) {
        setStatusMessage(result.error.message);
        setIsSubmitting(false);
        return;
      }

      setStatusMessage(`Novel created: ${result.data.title} (${result.data.id})`);
      setTitle("");
      setDescription("");
      setIsSubmitting(false);
    } catch {
      setStatusMessage("The novel could not be created right now. Please retry.");
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "720px",
          backgroundColor: "#ffffff",
          border: "1px solid #d7dfeb",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: "0 20px 60px rgba(19, 34, 56, 0.08)"
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "12px", fontSize: "32px" }}>Novel Foundation</h1>
        <p style={{ marginTop: 0, marginBottom: "24px", color: "#52637a", lineHeight: 1.6 }}>
          Phase 01 creates the root novel container before any volumes, milestones, or writing workflows exist.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <label style={{ display: "grid", gap: "8px" }}>
            <span style={{ fontWeight: 600 }}>Novel title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter the novel title"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #c1ccdd",
                fontSize: "16px"
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "8px" }}>
            <span style={{ fontWeight: 600 }}>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional setup for the novel root record"
              rows={5}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #c1ccdd",
                fontSize: "16px",
                resize: "vertical"
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              border: "none",
              borderRadius: "999px",
              backgroundColor: "#113355",
              color: "#ffffff",
              padding: "14px 20px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? "Creating..." : "Create Novel"}
          </button>
        </form>

        <p style={{ marginBottom: 0, marginTop: "20px", color: "#4c6078" }}>{statusMessage}</p>
      </section>
    </main>
  );
}
