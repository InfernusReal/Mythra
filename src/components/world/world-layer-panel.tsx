"use client";

import { useMemo, useState } from "react";

import type {
  WorldLayerKey,
  WorldLayerResult,
  WorldLayerTreeRecord,
  WorldOrderingMode
} from "../../modules/world-building/world-layer.types";
import { WorldLayerTree } from "./world-layer-tree";
import { WorldNodeForm } from "./world-node-form";

type WorldLayerPanelProps = {
  initialTree: WorldLayerTreeRecord;
};

export function WorldLayerPanel({ initialTree }: WorldLayerPanelProps) {
  const [treeState, setTreeState] = useState(initialTree);
  const [selectedLayerKey, setSelectedLayerKey] = useState<WorldLayerKey | null>(initialTree.layers[0]?.layerKey ?? null);
  const [statusMessage, setStatusMessage] = useState(initialTree.emptyStateMessage ?? "World layer foundation ready.");
  const [isSaving, setIsSaving] = useState(false);

  const selectedLayer = useMemo(
    () => treeState.layers.find((layer) => layer.layerKey === selectedLayerKey) ?? treeState.layers[0] ?? null,
    [selectedLayerKey, treeState.layers]
  );

  async function handleSubmit(formData: FormData) {
    if (!selectedLayer) {
      return;
    }

    setIsSaving(true);
    setStatusMessage("Saving world layer settings...");

    try {
      const response = await fetch("/api/world/layers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          volumeId: treeState.volume.id,
          layerKey: selectedLayer.layerKey,
          orderingMode: formData.get("orderingMode") as WorldOrderingMode,
          vibe: formData.get("vibe"),
          constraints: formData.get("constraints"),
          narrativeFlavor: formData.get("narrativeFlavor")
        })
      });
      const result = (await response.json()) as WorldLayerResult<WorldLayerTreeRecord>;

      if (!result.ok) {
        setStatusMessage(result.error.message);
        return;
      }

      setTreeState(result.data);
      setSelectedLayerKey(selectedLayer.layerKey);
      setStatusMessage("World layer settings saved.");
    } catch {
      setStatusMessage("Unable to save world-layer settings right now.");
    } finally {
      setIsSaving(false);
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
          World-Building Foundation
        </p>
        <h1 style={{ margin: 0, fontSize: "34px", color: "#132238" }}>{treeState.volume.title}</h1>
        <p style={{ margin: 0, color: "#52637a", lineHeight: 1.7 }}>
          Configure the fixed world-building layers for this volume before node-level world data is introduced in the
          next phase.
        </p>
        <span style={{ color: "#607287", fontSize: "14px" }}>
          Parent novel: {treeState.volume.novelTitle}
        </span>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 320px) minmax(0, 1fr) minmax(320px, 1fr)",
          gap: "20px",
          alignItems: "start"
        }}
      >
        <WorldLayerTree
          layers={treeState.layers}
          selectedLayerKey={selectedLayer?.layerKey ?? null}
          onSelectLayer={setSelectedLayerKey}
        />

        <section
          style={{
            borderRadius: "24px",
            border: "1px solid #d7dfeb",
            backgroundColor: "#ffffff",
            padding: "24px"
          }}
        >
          {selectedLayer ? (
            <form
              action={handleSubmit}
              style={{
                display: "grid",
                gap: "16px"
              }}
            >
              <div style={{ display: "grid", gap: "6px" }}>
                <strong style={{ color: "#132238", fontSize: "22px" }}>{selectedLayer.displayName}</strong>
                <span style={{ color: "#52637a", lineHeight: 1.6 }}>
                  This layer defines ranking rules and invariant narrative context for the world-building tree.
                </span>
              </div>

              <label style={{ display: "grid", gap: "8px", color: "#132238", fontWeight: 700 }}>
                Ordering mode
                <select
                  name="orderingMode"
                  defaultValue={selectedLayer.orderingMode}
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #c7d1df",
                    padding: "12px 14px",
                    fontSize: "15px"
                  }}
                >
                  <option value="STRONGEST_TO_WEAKEST">Strongest to weakest</option>
                  <option value="FIXED_CAP">Fixed cap</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: "8px", color: "#132238", fontWeight: 700 }}>
                Vibe
                <textarea
                  name="vibe"
                  defaultValue={selectedLayer.vibe ?? ""}
                  placeholder="Define the overall vibe for this world layer."
                  style={{
                    minHeight: "110px",
                    borderRadius: "16px",
                    border: "1px solid #c7d1df",
                    padding: "14px",
                    resize: "vertical",
                    fontSize: "15px",
                    lineHeight: 1.6
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "8px", color: "#132238", fontWeight: 700 }}>
                Constraints
                <textarea
                  name="constraints"
                  defaultValue={selectedLayer.constraints ?? ""}
                  placeholder="Describe the limits and structural constraints of this layer."
                  style={{
                    minHeight: "110px",
                    borderRadius: "16px",
                    border: "1px solid #c7d1df",
                    padding: "14px",
                    resize: "vertical",
                    fontSize: "15px",
                    lineHeight: 1.6
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "8px", color: "#132238", fontWeight: 700 }}>
                Narrative flavor
                <textarea
                  name="narrativeFlavor"
                  defaultValue={selectedLayer.narrativeFlavor ?? ""}
                  placeholder="Describe the narrative flavor this layer contributes to the novel."
                  style={{
                    minHeight: "110px",
                    borderRadius: "16px",
                    border: "1px solid #c7d1df",
                    padding: "14px",
                    resize: "vertical",
                    fontSize: "15px",
                    lineHeight: 1.6
                  }}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <span style={{ color: "#607287", fontSize: "14px" }}>{statusMessage}</span>
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
                  {isSaving ? "Saving..." : "Save layer"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ color: "#52637a", lineHeight: 1.7 }}>
              {treeState.emptyStateMessage ?? "Select a world layer to configure its rules."}
            </div>
          )}
        </section>

        <WorldNodeForm volumeId={treeState.volume.id} selectedLayer={selectedLayer} />
      </section>
    </section>
  );
}
