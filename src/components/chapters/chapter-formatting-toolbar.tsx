"use client";

import { useState, useTransition } from "react";

import type {
  ChapterFormattingPreferences,
  ChapterFormattingRecord
} from "../../modules/chapters/chapter-formatting.service";
import type { ChapterResult } from "../../modules/chapters/chapter.types";

type ChapterFormattingToolbarProps = {
  chapterId: string | null;
  initialPreferences: ChapterFormattingPreferences;
  onPreferencesChange: (preferences: ChapterFormattingPreferences) => void;
  updateFormattingAction: (input: {
    chapterId: string;
    fontFamily: ChapterFormattingPreferences["fontFamily"];
    fontSize: number;
    lineHeight: number;
  }) => Promise<ChapterResult<ChapterFormattingRecord>>;
};

const FONT_OPTIONS: ChapterFormattingPreferences["fontFamily"][] = [
  "Georgia",
  "Merriweather",
  "Lora",
  "Source Serif 4"
];

export function ChapterFormattingToolbar({
  chapterId,
  initialPreferences,
  onPreferencesChange,
  updateFormattingAction
}: ChapterFormattingToolbarProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [statusMessage, setStatusMessage] = useState("Formatting ready.");
  const [isPending, startTransition] = useTransition();

  function persistPreferences(nextPreferences: ChapterFormattingPreferences) {
    setPreferences(nextPreferences);
    onPreferencesChange(nextPreferences);

    if (!chapterId) {
      setStatusMessage("Formatting is unavailable in read-only fallback.");
      return;
    }

    startTransition(async () => {
      const result = await updateFormattingAction({
        chapterId,
        ...nextPreferences
      });

      if (!result.ok) {
        setStatusMessage(result.error.message);
        return;
      }

      setStatusMessage("Formatting saved.");
    });
  }

  return (
    <section
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        alignItems: "end",
        justifyContent: "space-between",
        borderRadius: "18px",
        border: "1px solid #d7dfeb",
        backgroundColor: "#ffffff",
        padding: "16px"
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "end" }}>
        <label style={{ display: "grid", gap: "6px", color: "#132238", fontSize: "13px", fontWeight: 700 }}>
          Font
          <select
            value={preferences.fontFamily}
            onChange={(event) =>
              persistPreferences({
                ...preferences,
                fontFamily: event.target.value as ChapterFormattingPreferences["fontFamily"]
              })
            }
            disabled={!chapterId || isPending}
            style={{
              borderRadius: "10px",
              border: "1px solid #c7d1df",
              padding: "9px 10px",
              minWidth: "150px"
            }}
          >
            {FONT_OPTIONS.map((fontFamily) => (
              <option key={fontFamily} value={fontFamily}>
                {fontFamily}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: "6px", color: "#132238", fontSize: "13px", fontWeight: 700 }}>
          Size
          <input
            type="number"
            min={12}
            max={24}
            value={preferences.fontSize}
            onChange={(event) =>
              persistPreferences({
                ...preferences,
                fontSize: Number(event.target.value)
              })
            }
            disabled={!chapterId || isPending}
            style={{
              borderRadius: "10px",
              border: "1px solid #c7d1df",
              padding: "9px 10px",
              width: "82px"
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "6px", color: "#132238", fontSize: "13px", fontWeight: 700 }}>
          Line
          <input
            type="number"
            min={1.2}
            max={2.2}
            step={0.1}
            value={preferences.lineHeight}
            onChange={(event) =>
              persistPreferences({
                ...preferences,
                lineHeight: Number(event.target.value)
              })
            }
            disabled={!chapterId || isPending}
            style={{
              borderRadius: "10px",
              border: "1px solid #c7d1df",
              padding: "9px 10px",
              width: "82px"
            }}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ color: "#607287", fontSize: "13px" }}>{isPending ? "Saving formatting..." : statusMessage}</span>
        {chapterId ? (
          <a
            href={`/api/chapters/${chapterId}/export`}
            style={{
              borderRadius: "999px",
              border: "1px solid #153a61",
              backgroundColor: "#153a61",
              color: "#ffffff",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            Export .doc
          </a>
        ) : null}
      </div>
    </section>
  );
}
