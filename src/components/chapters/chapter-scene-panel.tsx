"use client";

import type { ChapterEditorSceneItem } from "../../modules/chapters/chapter-editor.types";

type ChapterScenePanelProps = {
  scenes: ChapterEditorSceneItem[];
  selectedSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onInsertMarker: (marker: string) => void;
};

export function ChapterScenePanel({
  scenes,
  selectedSceneId,
  onSelectScene,
  onInsertMarker
}: ChapterScenePanelProps) {
  return (
    <aside
      style={{
        display: "grid",
        gap: "14px",
        alignContent: "start"
      }}
    >
      <header style={{ display: "grid", gap: "6px" }}>
        <p style={{ margin: 0, color: "#607287", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
          Scene Stack
        </p>
        <strong style={{ fontSize: "18px", color: "#132238" }}>Connected scenes stay open while writing.</strong>
      </header>

      {scenes.length === 0 ? (
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
          No scenes are linked yet. Add a scene from the structure toolbar to start building the chapter flow.
        </div>
      ) : (
        scenes.map((scene) => (
          <article
            key={scene.sceneId}
            style={{
              display: "grid",
              gap: "10px",
              borderRadius: "18px",
              border: scene.sceneId === selectedSceneId ? "1px solid #7fb0df" : "1px solid #d7dfeb",
              backgroundColor: scene.sceneId === selectedSceneId ? "#eef6ff" : "#ffffff",
              padding: "18px"
            }}
          >
            <button
              type="button"
              onClick={() => onSelectScene(scene.sceneId)}
              style={{
                display: "grid",
                gap: "6px",
                border: "none",
                backgroundColor: "transparent",
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
                color: "#132238"
              }}
            >
              <span style={{ color: "#607287", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                Scene {scene.sortOrder}
              </span>
              <strong style={{ fontSize: "17px" }}>{scene.outline}</strong>
              <span style={{ color: "#52637a", lineHeight: 1.6 }}>{scene.explanation}</span>
            </button>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px"
              }}
            >
              <button
                type="button"
                onClick={() => onInsertMarker(scene.startMarker)}
                style={{
                  borderRadius: "999px",
                  border: "1px solid #c1ccdd",
                  backgroundColor: "#ffffff",
                  color: "#1a466f",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Insert start marker
              </button>
              <button
                type="button"
                onClick={() => onInsertMarker(scene.endMarker)}
                style={{
                  borderRadius: "999px",
                  border: "1px solid #c1ccdd",
                  backgroundColor: "#ffffff",
                  color: "#1a466f",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Insert end marker
              </button>
            </div>
          </article>
        ))
      )}
    </aside>
  );
}
