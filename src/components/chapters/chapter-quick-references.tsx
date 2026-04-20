"use client";

import type { ChapterQuickReferenceItem } from "../../modules/chapters/chapter-editor.types";

type ChapterQuickReferencesProps = {
  references: ChapterQuickReferenceItem[];
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
};

export function ChapterQuickReferences({
  references,
  isCollapsed,
  onToggleCollapsed
}: ChapterQuickReferencesProps) {
  return (
    <aside
      style={{
        display: "grid",
        gap: "14px",
        alignContent: "start"
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px"
        }}
      >
        <div style={{ display: "grid", gap: "6px" }}>
          <p style={{ margin: 0, color: "#607287", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
            Quick References
          </p>
          <strong style={{ fontSize: "18px", color: "#132238" }}>Stay in the editor, keep context nearby.</strong>
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          style={{
            borderRadius: "999px",
            border: "1px solid #c1ccdd",
            backgroundColor: "#ffffff",
            color: "#1a466f",
            padding: "10px 12px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {isCollapsed ? "Open panel" : "Collapse panel"}
        </button>
      </header>

      {isCollapsed ? (
        <div
          style={{
            borderRadius: "18px",
            border: "1px dashed #c4d1e5",
            backgroundColor: "#ffffff",
            padding: "18px",
            color: "#607287",
            lineHeight: 1.6
          }}
        >
          The quick-reference panel is collapsed. Expand it to review scene explanations and marker ranges.
        </div>
      ) : references.length === 0 ? (
        <div
          style={{
            borderRadius: "18px",
            border: "1px dashed #c4d1e5",
            backgroundColor: "#ffffff",
            padding: "18px",
            color: "#607287",
            lineHeight: 1.6
          }}
        >
          No linked-scene references are available yet. Add a scene to surface its explanation here.
        </div>
      ) : (
        references.map((reference) => (
          <article
            key={reference.sceneId}
            style={{
              display: "grid",
              gap: "8px",
              borderRadius: "18px",
              border: "1px solid #d7dfeb",
              backgroundColor: "#ffffff",
              padding: "18px"
            }}
          >
            <strong style={{ fontSize: "16px", color: "#132238" }}>
              {reference.label}: {reference.outline}
            </strong>
            <span style={{ color: "#52637a", lineHeight: 1.6 }}>{reference.explanation}</span>
            <span style={{ color: "#607287", fontSize: "13px" }}>{reference.startMarker}</span>
            <span style={{ color: "#607287", fontSize: "13px" }}>{reference.endMarker}</span>
          </article>
        ))
      )}
    </aside>
  );
}
