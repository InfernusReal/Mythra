"use client";

import { useEffect, useMemo, useState } from "react";

import type { WorldNodeCollection, WorldNodeRecord, WorldNodeResult, WorldReminderScanRecord } from "../../modules/world-building/world-node.types";
import type { WorldLayerRecord } from "../../modules/world-building/world-layer.types";

type WorldNodeFormProps = {
  volumeId: string;
  selectedLayer: WorldLayerRecord | null;
};

type WorldNodeDraft = {
  nodeId?: string;
  name: string;
  positionJustification: string;
  advantages: string;
  disadvantages: string;
  relationships: string;
  geographicalLocation: string;
  traditions: string;
  specialTraits: string;
};

const EMPTY_DRAFT: WorldNodeDraft = {
  name: "",
  positionJustification: "",
  advantages: "",
  disadvantages: "",
  relationships: "",
  geographicalLocation: "",
  traditions: "",
  specialTraits: ""
};

function createDraftFromNode(node: WorldNodeRecord): WorldNodeDraft {
  return {
    nodeId: node.id,
    name: node.name,
    positionJustification: node.positionJustification ?? "",
    advantages: node.advantages ?? "",
    disadvantages: node.disadvantages ?? "",
    relationships: node.relationships ?? "",
    geographicalLocation: node.geographicalLocation ?? "",
    traditions: node.traditions ?? "",
    specialTraits: node.specialTraits ?? ""
  };
}

export function WorldNodeForm({ volumeId, selectedLayer }: WorldNodeFormProps) {
  const [collection, setCollection] = useState<WorldNodeCollection | null>(null);
  const [draft, setDraft] = useState<WorldNodeDraft>(EMPTY_DRAFT);
  const [statusMessage, setStatusMessage] = useState("World nodes ready.");
  const [isSaving, setIsSaving] = useState(false);
  const [isScanningReminders, setIsScanningReminders] = useState(false);

  useEffect(() => {
    if (!selectedLayer) {
      setCollection(null);
      setDraft(EMPTY_DRAFT);
      setStatusMessage("Select a world layer to manage its nodes.");
      return;
    }

    const activeLayer = selectedLayer;
    let isCancelled = false;

    async function loadNodes() {
      const activeLayerKey = activeLayer.layerKey;

      try {
        const response = await fetch(`/api/world/nodes?volumeId=${volumeId}&layerKey=${activeLayerKey}`, {
          method: "GET"
        });
        const result = (await response.json()) as WorldNodeResult<WorldNodeCollection>;

        if (isCancelled) {
          return;
        }

        if (!result.ok) {
          setCollection(null);
          setDraft(EMPTY_DRAFT);
          setStatusMessage(result.error.message);
          return;
        }

        setCollection(result.data);
        setDraft(EMPTY_DRAFT);
        setStatusMessage(result.data.emptyStateMessage ?? "World nodes loaded.");
      } catch {
        if (!isCancelled) {
          setCollection(null);
          setDraft(EMPTY_DRAFT);
          setStatusMessage("Unable to load world nodes right now.");
        }
      }
    }

    void loadNodes();

    return () => {
      isCancelled = true;
    };
  }, [selectedLayer, volumeId]);

  const incompleteNodeCount = useMemo(
    () => collection?.nodes.filter((node) => !node.isComplete).length ?? 0,
    [collection]
  );

  function updateDraftField(fieldName: keyof WorldNodeDraft, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [fieldName]: value
    }));
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedLayer) {
      return;
    }

    setIsSaving(true);
    setStatusMessage("Saving world node...");

    try {
      const response = await fetch("/api/world/nodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nodeId: draft.nodeId,
          volumeId,
          layerKey: selectedLayer.layerKey,
          name: formData.get("name"),
          positionJustification: formData.get("positionJustification"),
          advantages: formData.get("advantages"),
          disadvantages: formData.get("disadvantages"),
          relationships: formData.get("relationships"),
          geographicalLocation: formData.get("geographicalLocation"),
          traditions: formData.get("traditions"),
          specialTraits: formData.get("specialTraits")
        })
      });
      const result = (await response.json()) as WorldNodeResult<WorldNodeCollection>;

      if (!result.ok) {
        setStatusMessage(result.error.message);
        return;
      }

      setCollection(result.data);
      setDraft(EMPTY_DRAFT);
      const newlyIncompleteNode = result.data.nodes[0]?.isComplete === false;
      setStatusMessage(
        newlyIncompleteNode
          ? "World node saved as incomplete draft. Required fields still need completion."
          : "World node saved."
      );
    } catch {
      setStatusMessage("Unable to save the world node right now.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReminderScan() {
    setIsScanningReminders(true);
    setStatusMessage("Scanning incomplete world nodes for reminders...");

    try {
      const response = await fetch("/api/world/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          volumeId
        })
      });
      const result = (await response.json()) as WorldNodeResult<WorldReminderScanRecord>;

      if (!result.ok) {
        setStatusMessage(result.error.message);
        return;
      }

      setStatusMessage(
        result.data.queuedReminderCount === 0
          ? "No reminder was queued in this scan."
          : `${result.data.queuedReminderCount} reminder(s) queued for incomplete world nodes.`
      );

      if (selectedLayer) {
        const refreshedNodes = await fetch(`/api/world/nodes?volumeId=${volumeId}&layerKey=${selectedLayer.layerKey}`, {
          method: "GET"
        });
        const refreshedResult = (await refreshedNodes.json()) as WorldNodeResult<WorldNodeCollection>;

        if (refreshedResult.ok) {
          setCollection(refreshedResult.data);
        }
      }
    } catch {
      setStatusMessage("Unable to queue world-node reminders right now.");
    } finally {
      setIsScanningReminders(false);
    }
  }

  if (!selectedLayer) {
    return null;
  }

  return (
    <section
      style={{
        borderRadius: "24px",
        border: "1px solid #d7dfeb",
        backgroundColor: "#ffffff",
        padding: "24px",
        display: "grid",
        gap: "20px"
      }}
    >
      <div style={{ display: "grid", gap: "6px" }}>
        <strong style={{ color: "#132238", fontSize: "22px" }}>World nodes for {selectedLayer.displayName}</strong>
        <span style={{ color: "#52637a", lineHeight: 1.6 }}>
          Required metadata can be saved as a draft, but incomplete nodes remain visibly flagged and scheduled for
          reminders.
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center"
        }}
      >
        <span style={{ color: "#607287", fontSize: "14px" }}>
          {collection ? `${collection.nodes.length} node(s), ${incompleteNodeCount} incomplete` : "Node list not loaded yet."}
        </span>
        <button
          type="button"
          onClick={() => void handleReminderScan()}
          disabled={isScanningReminders}
          style={{
            borderRadius: "999px",
            border: "1px solid #153a61",
            backgroundColor: isScanningReminders ? "#dfe8f2" : "#ffffff",
            color: "#153a61",
            padding: "10px 14px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: isScanningReminders ? "not-allowed" : "pointer"
          }}
        >
          {isScanningReminders ? "Scanning..." : "Run reminder scan"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: "12px"
        }}
      >
        {collection?.nodes.length ? (
          collection.nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => {
                setDraft(createDraftFromNode(node));
                setStatusMessage(`Editing ${node.name}.`);
              }}
              style={{
                textAlign: "left",
                borderRadius: "16px",
                border: node.isComplete ? "1px solid #bfd9bf" : "1px solid #e3c28d",
                backgroundColor: node.isComplete ? "#f4fbf4" : "#fff8ee",
                padding: "14px",
                display: "grid",
                gap: "6px",
                cursor: "pointer"
              }}
            >
              <strong style={{ color: "#132238" }}>{node.name}</strong>
              <span style={{ color: "#52637a", lineHeight: 1.5 }}>{node.completionLabel}</span>
              {node.nextReminderDueAtLabel ? (
                <span style={{ color: "#607287", fontSize: "13px" }}>
                  Next reminder due: {new Date(node.nextReminderDueAtLabel).toLocaleString()}
                </span>
              ) : null}
            </button>
          ))
        ) : (
          <div
            style={{
              borderRadius: "16px",
              border: "1px solid #d7dfeb",
              backgroundColor: "#f8fafc",
              padding: "16px",
              color: "#52637a",
              lineHeight: 1.6
            }}
          >
            {collection?.emptyStateMessage ?? "No world nodes have been added to this layer yet."}
          </div>
        )}
      </div>

      <form
        action={handleSubmit}
        style={{
          display: "grid",
          gap: "14px"
        }}
      >
        <div style={{ display: "grid", gap: "6px" }}>
          <strong style={{ color: "#132238" }}>{draft.nodeId ? "Edit world node" : "Create world node"}</strong>
          <span style={{ color: "#52637a", lineHeight: 1.6 }}>
            Fill every required field to mark the node complete. Incomplete drafts remain saved and eligible for reminders.
          </span>
        </div>

        <label style={{ display: "grid", gap: "8px", color: "#132238", fontWeight: 700 }}>
          Node name
          <input
            name="name"
            value={draft.name}
            onChange={(event) => updateDraftField("name", event.target.value)}
            style={{
              borderRadius: "14px",
              border: "1px solid #c7d1df",
              padding: "12px 14px",
              fontSize: "15px"
            }}
          />
        </label>

        {[
          ["positionJustification", "Position justification"],
          ["advantages", "Advantages"],
          ["disadvantages", "Disadvantages"],
          ["relationships", "Relationships"],
          ["geographicalLocation", "Geographical location"],
          ["traditions", "Traditions"],
          ["specialTraits", "Exceptions / special traits"]
        ].map(([fieldName, label]) => (
          <label
            key={fieldName}
            style={{ display: "grid", gap: "8px", color: "#132238", fontWeight: 700 }}
          >
            {label}
            <textarea
              name={fieldName}
              value={draft[fieldName as keyof WorldNodeDraft] ?? ""}
              onChange={(event) => updateDraftField(fieldName as keyof WorldNodeDraft, event.target.value)}
              style={{
                minHeight: "96px",
                borderRadius: "16px",
                border: "1px solid #c7d1df",
                padding: "14px",
                resize: "vertical",
                fontSize: "15px",
                lineHeight: 1.6
              }}
            />
          </label>
        ))}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <span style={{ color: "#607287", fontSize: "14px" }}>{statusMessage}</span>
          <div
            style={{
              display: "flex",
              gap: "10px"
            }}
          >
            {draft.nodeId ? (
              <button
                type="button"
                onClick={() => {
                  setDraft(EMPTY_DRAFT);
                  setStatusMessage("Create a new world node or select an existing one to edit.");
                }}
                style={{
                  borderRadius: "999px",
                  border: "1px solid #c7d1df",
                  backgroundColor: "#ffffff",
                  color: "#153a61",
                  padding: "12px 18px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              style={{
                borderRadius: "999px",
                border: "1px solid #153a61",
                backgroundColor: isSaving ? "#dfe8f2" : "#153a61",
                color: isSaving ? "#607287" : "#ffffff",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: isSaving ? "not-allowed" : "pointer"
              }}
            >
              {isSaving ? "Saving..." : draft.nodeId ? "Save node draft" : "Create node draft"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
