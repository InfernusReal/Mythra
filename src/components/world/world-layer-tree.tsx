import type { WorldLayerRecord, WorldLayerKey } from "../../modules/world-building/world-layer.types";

type WorldLayerTreeProps = {
  layers: WorldLayerRecord[];
  selectedLayerKey: WorldLayerKey | null;
  onSelectLayer: (layerKey: WorldLayerKey) => void;
};

export function WorldLayerTree({ layers, selectedLayerKey, onSelectLayer }: WorldLayerTreeProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "12px"
      }}
    >
      {layers.map((layer) => {
        const isSelected = layer.layerKey === selectedLayerKey;

        return (
          <button
            key={layer.layerKey}
            type="button"
            onClick={() => onSelectLayer(layer.layerKey)}
            style={{
              textAlign: "left",
              borderRadius: "18px",
              border: isSelected ? "1px solid #153a61" : "1px solid #d7dfeb",
              backgroundColor: isSelected ? "#eef5ff" : "#ffffff",
              padding: "16px",
              display: "grid",
              gap: "6px",
              cursor: "pointer"
            }}
          >
            <span
              style={{
                color: "#607287",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase"
              }}
            >
              Layer {layer.position}
            </span>
            <strong style={{ color: "#132238" }}>{layer.displayName}</strong>
            <span style={{ color: "#52637a", lineHeight: 1.5 }}>{layer.orderingModeLabel}</span>
          </button>
        );
      })}
    </section>
  );
}
