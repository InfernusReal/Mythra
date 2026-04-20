"use client";

import Link from "next/link";
import { useState } from "react";

import { formatSceneLabel } from "../../modules/scenes/scene.mapper";
import type {
  SceneDetailRecord,
  SceneGraphCollection,
  SceneResult
} from "../../modules/scenes/scene.types";
import { SceneForm } from "./scene-form";

type SceneGraphProps = {
  initialState: SceneGraphCollection;
};

export function SceneGraph({ initialState }: SceneGraphProps) {
  const [graphState, setGraphState] = useState(initialState);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [outline, setOutline] = useState("");
  const [explanation, setExplanation] = useState("");
  const [relationship, setRelationship] = useState("");
  const [fromSceneId, setFromSceneId] = useState("");
  const [toSceneId, setToSceneId] = useState("");
  const [statusMessage, setStatusMessage] = useState("Create the next scene and connect it into the milestone flow.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  async function handleSceneSubmit() {
    setIsSubmitting(true);
    setStatusMessage(editingSceneId ? "Updating scene..." : "Creating scene...");

    try {
      const response = await fetch("/api/scenes", {
        method: editingSceneId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          editingSceneId
            ? {
                sceneId: editingSceneId,
                outline,
                explanation
              }
            : {
                milestoneId: graphState.milestone.id,
                outline,
                explanation
              }
        )
      });

      const result = (await response.json()) as SceneResult<SceneDetailRecord>;

      if (!result.ok) {
        setStatusMessage(result.error.message);
        setIsSubmitting(false);
        return;
      }

      setGraphState((currentState) => {
        const nextScenes = editingSceneId
          ? currentState.scenes.map((scene) => (scene.id === result.data.scene.id ? result.data.scene : scene))
          : [...currentState.scenes, result.data.scene];

        return {
          ...currentState,
          scenes: nextScenes
        };
      });
      setEditingSceneId(null);
      setOutline("");
      setExplanation("");
      setStatusMessage(editingSceneId ? "Scene updated." : "Scene created.");
      setIsSubmitting(false);
    } catch {
      setStatusMessage("The scene could not be saved right now. Please retry.");
      setIsSubmitting(false);
    }
  }

  function handleEditScene(sceneId: string) {
    const scene = graphState.scenes.find((item) => item.id === sceneId);

    if (!scene) {
      return;
    }

    setEditingSceneId(scene.id);
    setOutline(scene.outline);
    setExplanation(scene.explanation);
    setStatusMessage("Editing scene details.");
  }

  function handleCancelEdit() {
    setEditingSceneId(null);
    setOutline("");
    setExplanation("");
    setStatusMessage("Scene editing cancelled.");
  }

  async function handleCreateRelationship() {
    setIsLinking(true);
    setStatusMessage("Linking scene transition...");

    try {
      const response = await fetch("/api/scenes/graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          milestoneId: graphState.milestone.id,
          fromSceneId,
          toSceneId,
          relationship
        })
      });

      const result = (await response.json()) as SceneResult<SceneGraphCollection>;

      if (!result.ok) {
        setStatusMessage(result.error.message);
        setIsLinking(false);
        return;
      }

      setGraphState(result.data);
      setRelationship("");
      setFromSceneId("");
      setToSceneId("");
      setStatusMessage("Scene transition created.");
      setIsLinking(false);
    } catch {
      setStatusMessage("The scene transition could not be created right now. Please retry.");
      setIsLinking(false);
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
          Scene Planning
        </p>
        <h1 style={{ margin: 0, fontSize: "32px" }}>{graphState.milestone.title}</h1>
        <p style={{ margin: 0, color: "#52637a", lineHeight: 1.6 }}>
          Scenes stay structured here before chapter writing begins. The milestone owns the scene list and the graph
          defines sequence, transitions, and relationships.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <Link
            href={`/milestones/${graphState.milestone.id}`}
            style={{ color: "#1a466f", fontWeight: 700, textDecoration: "none" }}
          >
            Return to milestone detail
          </Link>
          <Link
            href={`/volumes/${graphState.milestone.volumeId}/milestones`}
            style={{ color: "#1a466f", fontWeight: 700, textDecoration: "none" }}
          >
            Return to milestone graph
          </Link>
        </div>
      </header>

      <SceneForm
        outline={outline}
        explanation={explanation}
        isSubmitting={isSubmitting}
        isEditing={editingSceneId !== null}
        statusMessage={statusMessage}
        onOutlineChange={setOutline}
        onExplanationChange={setExplanation}
        onSubmit={handleSceneSubmit}
        onCancelEdit={handleCancelEdit}
      />

      <section
        style={{
          display: "grid",
          gap: "16px"
        }}
      >
        <h2 style={{ margin: 0, fontSize: "20px" }}>Scene Stack</h2>
        {graphState.scenes.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px dashed #c4d1e5",
              borderRadius: "18px",
              padding: "20px",
              color: "#607287"
            }}
          >
            No scenes exist yet for this milestone. Create the first scene to start the graph.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px"
            }}
          >
            {graphState.scenes.map((scene, index) => (
              <article
                key={scene.id}
                style={{
                  display: "grid",
                  gap: "10px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #d7dfeb",
                  borderRadius: "18px",
                  padding: "20px"
                }}
              >
                <strong style={{ fontSize: "18px" }}>{formatSceneLabel(scene, index)}</strong>
                <span style={{ color: "#132238", lineHeight: 1.6 }}>{scene.outline}</span>
                <span style={{ color: "#607287", lineHeight: 1.6 }}>{scene.explanation}</span>
                <button
                  type="button"
                  onClick={() => handleEditScene(scene.id)}
                  style={{
                    width: "fit-content",
                    borderRadius: "999px",
                    border: "1px solid #c1ccdd",
                    backgroundColor: "#ffffff",
                    color: "#1a466f",
                    padding: "10px 14px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Edit Scene
                </button>
              </article>
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
        <h2 style={{ margin: 0, fontSize: "20px" }}>Scene Graph Relationships</h2>
        {graphState.scenes.length < 2 ? (
          <p style={{ margin: 0, color: "#607287" }}>
            At least two scenes are required before a sequence or transition can be linked.
          </p>
        ) : (
          <>
            <select
              value={fromSceneId}
              onChange={(event) => setFromSceneId(event.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #c1ccdd",
                fontSize: "16px"
              }}
            >
              <option value="">From scene</option>
              {graphState.scenes.map((scene, index) => (
                <option key={scene.id} value={scene.id}>
                  {formatSceneLabel(scene, index)}
                </option>
              ))}
            </select>
            <select
              value={toSceneId}
              onChange={(event) => setToSceneId(event.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #c1ccdd",
                fontSize: "16px"
              }}
            >
              <option value="">To scene</option>
              {graphState.scenes.map((scene, index) => (
                <option key={scene.id} value={scene.id}>
                  {formatSceneLabel(scene, index)}
                </option>
              ))}
            </select>
            <input
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
              placeholder="Transition or relationship"
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #c1ccdd",
                fontSize: "16px"
              }}
            />
            <button
              type="button"
              onClick={handleCreateRelationship}
              disabled={isLinking}
              style={{
                width: "fit-content",
                border: "none",
                borderRadius: "999px",
                backgroundColor: "#1a466f",
                color: "#ffffff",
                padding: "14px 20px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: isLinking ? "not-allowed" : "pointer",
                opacity: isLinking ? 0.7 : 1
              }}
            >
              {isLinking ? "Linking..." : "Create Transition"}
            </button>
          </>
        )}

        <div
          style={{
            display: "grid",
            gap: "12px"
          }}
        >
          <strong>Current Relationships</strong>
          {graphState.relationships.length === 0 ? (
            <span style={{ color: "#607287" }}>No scene transitions have been defined yet.</span>
          ) : (
            graphState.relationships.map((relationshipRecord) => (
              <div
                key={relationshipRecord.id}
                style={{
                  borderRadius: "14px",
                  backgroundColor: "#f5f7fb",
                  padding: "14px 16px",
                  color: "#132238"
                }}
              >
                {relationshipRecord.fromSceneOutline} {" -> "} {relationshipRecord.toSceneOutline}
                <span style={{ color: "#607287" }}> ({relationshipRecord.relationship})</span>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
