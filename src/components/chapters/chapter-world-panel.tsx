"use client";

import { useEffect } from "react";

import type { ChapterWorldContextRecord } from "../../modules/world-building/world-reference.types";

type ChapterWorldPanelProps = {
  context: ChapterWorldContextRecord | null;
};

export function ChapterWorldPanel({ context }: ChapterWorldPanelProps) {
  const referencedNodeCount = context?.referencedNodeCount ?? 0;

  useEffect(() => {
    console.log("[P13][ChapterWorldPanel] Side panel hydrated", {
      chapterId: context?.chapterId ?? null,
      referencedNodeCount
    }); // SAFETY_LOG:P13_SIDE_PANEL_HYDRATE

    if (!context || referencedNodeCount === 0) {
      console.log("[P13][ChapterWorldPanel] Safe panel render", {
        chapterId: context?.chapterId ?? null,
        reason: context ? "NO_REFERENCES" : "CONTEXT_UNAVAILABLE"
      }); // SAFETY_LOG:P13_SAFE_PANEL_RENDER
    }
  }, [context, referencedNodeCount]);

  if (!context || referencedNodeCount === 0) {
    return (
      <section
        style={{
          borderRadius: "18px",
          border: "1px dashed #c4d1e5",
          backgroundColor: "#ffffff",
          padding: "18px",
          color: "#607287",
          lineHeight: 1.6
        }}
      >
        {context?.emptyStateMessage ?? "World references are not available for this chapter yet."}
      </section>
    );
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "14px"
      }}
    >
      <header style={{ display: "grid", gap: "6px" }}>
        <p style={{ margin: 0, color: "#607287", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
          World Context
        </p>
        <strong style={{ fontSize: "18px", color: "#132238" }}>
          {referencedNodeCount} linked world reference(s)
        </strong>
      </header>

      {context.scenes.map((scene) =>
        scene.nodes.length === 0 ? null : (
          <article
            key={scene.sceneId}
            style={{
              display: "grid",
              gap: "12px",
              borderRadius: "18px",
              border: "1px solid #d7dfeb",
              backgroundColor: "#ffffff",
              padding: "18px"
            }}
          >
            <strong style={{ color: "#132238" }}>
              Scene {scene.sceneSortOrder}: {scene.sceneOutline}
            </strong>
            {scene.nodes.map((node) => (
              <div
                key={node.worldNodeId}
                style={{
                  display: "grid",
                  gap: "6px",
                  borderTop: "1px solid #e6edf6",
                  paddingTop: "12px"
                }}
              >
                <span style={{ color: "#132238", fontWeight: 700 }}>{node.nodeName}</span>
                <span style={{ color: "#607287", fontSize: "13px" }}>{node.layerName}</span>
                {node.geographicalLocation ? (
                  <span style={{ color: "#52637a", lineHeight: 1.6 }}>{node.geographicalLocation}</span>
                ) : null}
                {node.relationships ? (
                  <span style={{ color: "#52637a", lineHeight: 1.6 }}>{node.relationships}</span>
                ) : null}
                {node.specialTraits ? (
                  <span style={{ color: "#52637a", lineHeight: 1.6 }}>{node.specialTraits}</span>
                ) : null}
                {!node.isComplete ? (
                  <span style={{ color: "#8a5a12", fontSize: "13px", fontWeight: 700 }}>
                    {node.missingRequiredFields.length} world field(s) still incomplete
                  </span>
                ) : null}
              </div>
            ))}
          </article>
        )
      )}
    </section>
  );
}
