import type { NextSceneSuggestionRecord } from "../../modules/scenes/next-scene.service";

type NextSceneSuggestionProps = {
  suggestion: NextSceneSuggestionRecord | null;
};

export function NextSceneSuggestion({ suggestion }: NextSceneSuggestionProps) {
  if (!suggestion) {
    return (
      <article
        style={{
          borderRadius: "20px",
          border: "1px solid #d7dfeb",
          backgroundColor: "#ffffff",
          padding: "18px",
          display: "grid",
          gap: "8px"
        }}
      >
        <strong style={{ color: "#132238" }}>Next scene suggestion</strong>
        <span style={{ color: "#52637a", lineHeight: 1.6 }}>
          No further scene suggestion is available yet. The current chapter structure already covers the available milestone
          scenes.
        </span>
      </article>
    );
  }

  return (
    <article
      style={{
        borderRadius: "20px",
        border: "1px solid #d7dfeb",
        backgroundColor: "#ffffff",
        padding: "18px",
        display: "grid",
        gap: "8px"
      }}
    >
      <strong style={{ color: "#132238" }}>Next scene suggestion</strong>
      <span style={{ color: "#1a466f", fontWeight: 700 }}>{suggestion.outline}</span>
      <span style={{ color: "#52637a", lineHeight: 1.6 }}>{suggestion.explanation}</span>
      <span style={{ color: "#607287", fontSize: "13px" }}>{suggestion.reasonLabel}</span>
    </article>
  );
}
