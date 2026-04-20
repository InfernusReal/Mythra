"use client";

import type { ChapterEditorRecord } from "../../modules/chapters/chapter-editor.types";

type ChapterStructureToolbarProps = {
  editor: ChapterEditorRecord;
  selectedAvailableSceneId: string;
  selectedLinkedSceneId: string;
  pendingCommand: "ADD_SCENE" | "REMOVE_SCENE" | null;
  statusMessage: string;
  onSelectSceneToAdd: (sceneId: string) => void;
  onAddScene: () => void;
  onRemoveScene: () => void;
};

export function ChapterStructureToolbar({
  editor,
  selectedAvailableSceneId,
  selectedLinkedSceneId,
  pendingCommand,
  statusMessage,
  onSelectSceneToAdd,
  onAddScene,
  onRemoveScene
}: ChapterStructureToolbarProps) {
  const selectedLinkedScene = editor.sceneStack.find((scene) => scene.sceneId === selectedLinkedSceneId) ?? null;

  return (
    <section
      style={{
        display: "grid",
        gap: "16px",
        borderRadius: "20px",
        border: "1px solid #d7dfeb",
        backgroundColor: "#ffffff",
        padding: "20px"
      }}
    >
      <header style={{ display: "grid", gap: "6px" }}>
        <p style={{ margin: 0, color: "#607287", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
          Structure Controls
        </p>
        <strong style={{ fontSize: "18px", color: "#132238" }}>Keep structure visible without leaving the editor.</strong>
        <span style={{ color: "#52637a", lineHeight: 1.5 }}>{statusMessage}</span>
      </header>

      <div
        style={{
          display: "grid",
          gap: "12px"
        }}
      >
        <label style={{ display: "grid", gap: "8px", color: "#132238", fontWeight: 700 }}>
          Add linked scene
          <select
            value={selectedAvailableSceneId}
            onChange={(event) => onSelectSceneToAdd(event.target.value)}
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #c1ccdd",
              fontSize: "15px",
              color: "#132238"
            }}
          >
            <option value="">{editor.availableScenes.length === 0 ? "No scenes available" : "Select a scene"}</option>
            {editor.availableScenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.outline}
              </option>
            ))}
          </select>
        </label>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          <button
            type="button"
            onClick={onAddScene}
            disabled={
              pendingCommand !== null || selectedAvailableSceneId.length === 0 || editor.editorMode === "READ_ONLY"
            }
            style={{
              border: "none",
              borderRadius: "999px",
              backgroundColor: "#1a466f",
              color: "#ffffff",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 700,
              cursor:
                pendingCommand !== null || selectedAvailableSceneId.length === 0 || editor.editorMode === "READ_ONLY"
                  ? "not-allowed"
                  : "pointer",
              opacity:
                pendingCommand !== null || selectedAvailableSceneId.length === 0 || editor.editorMode === "READ_ONLY"
                  ? 0.65
                  : 1
            }}
          >
            {pendingCommand === "ADD_SCENE" ? "Adding scene..." : "Add scene"}
          </button>

          <button
            type="button"
            onClick={onRemoveScene}
            disabled={pendingCommand !== null || selectedLinkedScene === null || editor.editorMode === "READ_ONLY"}
            style={{
              borderRadius: "999px",
              border: "1px solid #c1ccdd",
              backgroundColor: "#ffffff",
              color: "#1a466f",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 700,
              cursor:
                pendingCommand !== null || selectedLinkedScene === null || editor.editorMode === "READ_ONLY"
                  ? "not-allowed"
                  : "pointer",
              opacity: pendingCommand !== null || selectedLinkedScene === null || editor.editorMode === "READ_ONLY" ? 0.65 : 1
            }}
          >
            {pendingCommand === "REMOVE_SCENE" ? "Removing scene..." : "Remove selected linked scene"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "8px",
          borderRadius: "16px",
          backgroundColor: "#f5f7fb",
          padding: "16px"
        }}
      >
        <strong style={{ color: "#132238" }}>Selected linked scene markers</strong>
        {selectedLinkedScene ? (
          <>
            <span style={{ color: "#52637a" }}>{selectedLinkedScene.startMarker}</span>
            <span style={{ color: "#52637a" }}>{selectedLinkedScene.endMarker}</span>
          </>
        ) : (
          <span style={{ color: "#607287" }}>Choose a linked scene from the scene stack to see its structure markers.</span>
        )}
      </div>
    </section>
  );
}
