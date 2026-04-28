"use client";

import Link from "next/link";
import { startTransition, useEffect, useState, useTransition } from "react";

import { evaluateWordLimit } from "../../lib/guards/word-limit";
import {
  clearLocalDraft,
  loadLocalDraft,
  persistLocalDraft
} from "../../lib/editor/local-draft-store";
import type { ChapterSaveRecord } from "../../modules/chapters/chapter-save.service";
import type {
  ChapterEditorRecord,
  ChapterEditorResult,
  ChapterStructureCommandInput
} from "../../modules/chapters/chapter-editor.types";
import type { ChapterResult } from "../../modules/chapters/chapter.types";
import type { ChapterFormattingRecord } from "../../modules/chapters/chapter-formatting.service";
import type { ChapterFormattingPreferences } from "../../modules/chapters/chapter-formatting.service";
import type { ChapterWorldContextRecord } from "../../modules/world-building/world-reference.types";
import { ChapterFormattingToolbar } from "./chapter-formatting-toolbar";
import { ChapterGuidanceStrip } from "./chapter-guidance-strip";
import { ChapterQuickReferences } from "./chapter-quick-references";
import { ChapterScenePanel } from "./chapter-scene-panel";
import { ChapterStructureToolbar } from "./chapter-structure-toolbar";
import { ChapterWorldPanel } from "./chapter-world-panel";

type ChapterEditorProps = {
  initialEditor: ChapterEditorRecord;
  initialWorldContext: ChapterWorldContextRecord | null;
  updateFormattingAction: (input: {
    chapterId: string;
    fontFamily: ChapterFormattingPreferences["fontFamily"];
    fontSize: number;
    lineHeight: number;
  }) => Promise<ChapterResult<ChapterFormattingRecord>>;
  addSceneAction: (input: ChapterStructureCommandInput) => Promise<ChapterEditorResult>;
  removeSceneAction: (input: ChapterStructureCommandInput) => Promise<ChapterEditorResult>;
};

const AUTOSAVE_INTERVAL_MS = 4000;

type SaveLifecycleState = "IDLE" | "SAVING_AUTO" | "SAVING_MANUAL" | "SAVED" | "ERROR" | "CONFLICT";

function resolveInitialSelectedSceneId(editor: ChapterEditorRecord): string {
  return editor.sceneStack[0]?.sceneId ?? "";
}

export function ChapterEditor({
  initialEditor,
  initialWorldContext,
  updateFormattingAction,
  addSceneAction,
  removeSceneAction
}: ChapterEditorProps) {
  const [editorState, setEditorState] = useState(initialEditor);
  const [worldContext, setWorldContext] = useState(initialWorldContext);
  const [draftText, setDraftText] = useState(initialEditor.draftTemplate);
  const [selectedLinkedSceneId, setSelectedLinkedSceneId] = useState(resolveInitialSelectedSceneId(initialEditor));
  const [selectedAvailableSceneId, setSelectedAvailableSceneId] = useState("");
  const [isQuickReferencesCollapsed, setIsQuickReferencesCollapsed] = useState(false);
  const [statusMessage, setStatusMessage] = useState(initialEditor.statusMessage);
  const [lastSyncedDraft, setLastSyncedDraft] = useState(initialEditor.draftTemplate);
  const [saveLifecycleState, setSaveLifecycleState] = useState<SaveLifecycleState>("IDLE");
  const [savedVersion, setSavedVersion] = useState(initialEditor.savedVersion);
  const [lastSavedAt, setLastSavedAt] = useState(initialEditor.lastSavedAt);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingCommand, startCommandTransition] = useTransition();
  const [activeCommand, setActiveCommand] = useState<"ADD_SCENE" | "REMOVE_SCENE" | null>(null);
  const wordLimitRecord = evaluateWordLimit(draftText, editorState.maxWordCount);

  useEffect(() => {
    setEditorState(initialEditor);
    setWorldContext(initialWorldContext);
    setDraftText(initialEditor.draftTemplate);
    setLastSyncedDraft(initialEditor.draftTemplate);
    setSelectedLinkedSceneId(resolveInitialSelectedSceneId(initialEditor));
    setSelectedAvailableSceneId("");
    setStatusMessage(initialEditor.statusMessage);
    setSaveLifecycleState("IDLE");
    setSavedVersion(initialEditor.savedVersion);
    setLastSavedAt(initialEditor.lastSavedAt);
    setHasUnsavedChanges(false);

    if (initialEditor.chapter) {
      const recoveredDraft = loadLocalDraft(initialEditor.chapter.id);

      if (recoveredDraft && recoveredDraft.body !== initialEditor.draftTemplate) {
        setDraftText(recoveredDraft.body);
        setSavedVersion(recoveredDraft.savedVersion);
        setStatusMessage("Recovered a local draft from the previous session.");
        setSaveLifecycleState("ERROR");
        setHasUnsavedChanges(true);
        console.log("[P09][ChapterEditor] Reload recovery path used", {
          chapterId: initialEditor.chapter.id,
          savedVersion: recoveredDraft.savedVersion
        }); // SAFETY_LOG:P09_RELOAD_RECOVERY_PATH
      }
    }
  }, [initialEditor, initialWorldContext]);

  useEffect(() => {
    if (!editorState.chapter || editorState.editorMode === "READ_ONLY" || !hasUnsavedChanges) {
      return;
    }

    persistLocalDraft({
      chapterId: editorState.chapter.id,
      body: draftText,
      savedVersion,
      wordCount: wordLimitRecord.wordCount,
      updatedAt: new Date().toISOString()
    });
  }, [draftText, editorState.chapter, editorState.editorMode, hasUnsavedChanges, savedVersion, wordLimitRecord.wordCount]);

  function insertMarker(marker: string) {
    setDraftText((currentDraft) => {
      const nextDraft = currentDraft.length === 0 ? marker : `${currentDraft}\n${marker}`;
      setHasUnsavedChanges(nextDraft !== lastSyncedDraft);
      return nextDraft;
    });
    setSaveLifecycleState("IDLE");
    setStatusMessage("Structure marker inserted into the editor.");
  }

  function handleActionResult(result: ChapterEditorResult, successMessage: string) {
    if (!result.ok) {
      setStatusMessage(result.error.message);
      return;
    }

    startTransition(() => {
      setEditorState(result.data);
      setSelectedLinkedSceneId(resolveInitialSelectedSceneId(result.data));
      setSelectedAvailableSceneId("");
      setStatusMessage(successMessage);
      setSavedVersion(result.data.savedVersion);
    });
  }

  async function runSave(saveMode: "AUTO" | "MANUAL") {
    if (!editorState.chapter || editorState.editorMode === "READ_ONLY") {
      return;
    }

    setSaveLifecycleState(saveMode === "AUTO" ? "SAVING_AUTO" : "SAVING_MANUAL");
    setStatusMessage(saveMode === "AUTO" ? "Saving..." : "Saving draft...");

    try {
      const response = await fetch(`/api/chapters/${editorState.chapter.id}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          body: draftText,
          expectedSavedVersion: savedVersion,
          saveMode
        })
      });
      const result = (await response.json()) as ChapterResult<ChapterSaveRecord>;

      if (!result.ok) {
        if (result.error.code === "SAVE_CONFLICT") {
          setSaveLifecycleState("CONFLICT");
          setStatusMessage(result.error.message);
          return;
        }

        if (result.error.code === "WORD_LIMIT_REACHED") {
          setSaveLifecycleState("ERROR");
          setStatusMessage(result.error.message);
          return;
        }

        setSaveLifecycleState("ERROR");
        setStatusMessage(result.error.message);
        return;
      }

      startTransition(() => {
        setEditorState((currentEditor) => ({
          ...currentEditor,
          chapter: currentEditor.chapter === null ? currentEditor.chapter : result.data.chapter,
          wordCount: result.data.wordCount,
          maxWordCount: result.data.maxWordCount,
          remainingWords: result.data.remainingWords,
          lastSavedAt: result.data.savedAt
        }));
        setLastSyncedDraft(result.data.chapter.body);
        setSavedVersion(result.data.chapter.savedVersion);
        setLastSavedAt(result.data.savedAt);
        setHasUnsavedChanges(false);
        setSaveLifecycleState("SAVED");
        setStatusMessage("Saved");
      });

      clearLocalDraft(result.data.chapter.id);
    } catch {
      setSaveLifecycleState("ERROR");
      setStatusMessage("Save failed. Local draft remains preserved on this device.");
    }
  }

  useEffect(() => {
    if (
      !editorState.chapter ||
      editorState.editorMode === "READ_ONLY" ||
      !hasUnsavedChanges ||
      saveLifecycleState === "SAVING_AUTO" ||
      saveLifecycleState === "SAVING_MANUAL" ||
      saveLifecycleState === "CONFLICT"
    ) {
      return;
    }

    const autosaveTimer = window.setTimeout(() => {
      void runSave("AUTO");
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearTimeout(autosaveTimer);
    };
  }, [draftText, editorState.chapter, editorState.editorMode, hasUnsavedChanges, saveLifecycleState, savedVersion]);

  function handleAddScene() {
    if (selectedAvailableSceneId.length === 0 || editorState.chapter === null) {
      setStatusMessage("Select an available scene before adding it to the chapter.");
      return;
    }

    setActiveCommand("ADD_SCENE");
    startCommandTransition(async () => {
      const result = await addSceneAction({
        chapterId: editorState.chapter!.id,
        sceneId: selectedAvailableSceneId
      });

      setActiveCommand(null);
      handleActionResult(result, "Scene added to the chapter structure. Insert its markers when you are ready.");
    });
  }

  function handleRemoveScene() {
    if (selectedLinkedSceneId.length === 0 || editorState.chapter === null) {
      setStatusMessage("Select a linked scene before removing it from the chapter.");
      return;
    }

    setActiveCommand("REMOVE_SCENE");
    startCommandTransition(async () => {
      const result = await removeSceneAction({
        chapterId: editorState.chapter!.id,
        sceneId: selectedLinkedSceneId
      });

      setActiveCommand(null);
      handleActionResult(result, "Scene removed from the chapter structure.");
    });
  }

  function handleDraftChange(nextDraft: string) {
    const nextWordLimitRecord = evaluateWordLimit(nextDraft, editorState.maxWordCount);

    if (nextWordLimitRecord.isOverLimit && nextDraft.length > draftText.length) {
      setSaveLifecycleState("ERROR");
      setStatusMessage(`This chapter reached the hard limit of ${nextWordLimitRecord.maxWordCount} words.`);
      return;
    }

    setDraftText(nextDraft);
    setHasUnsavedChanges(nextDraft !== lastSyncedDraft);
    setSaveLifecycleState("IDLE");
    setStatusMessage("Unsaved changes");
  }

  function resolveSaveStateLabel(): string {
    if (saveLifecycleState === "SAVING_AUTO" || saveLifecycleState === "SAVING_MANUAL") {
      return "Saving...";
    }

    if (saveLifecycleState === "SAVED" && lastSavedAt) {
      return `Saved at ${new Date(lastSavedAt).toLocaleTimeString()}`;
    }

    if (saveLifecycleState === "CONFLICT") {
      return "Save blocked by newer server draft.";
    }

    if (saveLifecycleState === "ERROR") {
      return "Local draft protected.";
    }

    return hasUnsavedChanges ? "Unsaved changes" : "Ready";
  }

  const milestoneHref = editorState.milestone ? `/milestones/${editorState.milestone.id}` : "/today";
  const guidanceRefreshKey = editorState.sceneStack.map((scene) => scene.sceneId).join(",");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px",
        background:
          "linear-gradient(180deg, #eef4fb 0%, #f7f9fc 42%, #ffffff 100%)"
      }}
    >
      <section
        style={{
          display: "grid",
          gap: "20px"
        }}
      >
        <header
          style={{
            display: "grid",
            gap: "10px",
            borderRadius: "24px",
            backgroundColor: "#ffffff",
            border: "1px solid #d7dfeb",
            padding: "24px"
          }}
        >
          <p style={{ margin: 0, color: "#607287", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
            Guided Chapter Editor
          </p>
          <h1 style={{ margin: 0, fontSize: "34px", color: "#132238" }}>
            {editorState.chapter?.title ?? "Chapter editor fallback"}
          </h1>
          <p style={{ margin: 0, color: "#52637a", lineHeight: 1.7 }}>
            {editorState.milestone
              ? `Write directly inside the chapter while the linked scene stack and references remain visible. Milestone: ${editorState.milestone.title}.`
              : "The editor entered a safe read-only fallback. You can review structure, but mutating commands are disabled until the next successful load."}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center"
            }}
          >
            <Link href={milestoneHref} style={{ color: "#1a466f", fontWeight: 700, textDecoration: "none" }}>
              Return to milestone
            </Link>
            <Link href="/today" style={{ color: "#1a466f", fontWeight: 700, textDecoration: "none" }}>
              Return to today's queue
            </Link>
            <span style={{ color: "#607287" }}>
              {editorState.editorMode === "ACTIVE"
                ? "Autosave now runs in the background while local draft recovery protects unsaved work."
                : "Read-only fallback active."}
            </span>
          </div>
        </header>

        <ChapterStructureToolbar
          editor={editorState}
          selectedAvailableSceneId={selectedAvailableSceneId}
          selectedLinkedSceneId={selectedLinkedSceneId}
          pendingCommand={pendingCommand ? activeCommand : null}
          statusMessage={statusMessage}
          onSelectSceneToAdd={setSelectedAvailableSceneId}
          onAddScene={handleAddScene}
          onRemoveScene={handleRemoveScene}
        />

        <ChapterFormattingToolbar
          chapterId={editorState.chapter?.id ?? null}
          initialPreferences={editorState.formattingPreferences}
          onPreferencesChange={(preferences) =>
            setEditorState((currentEditor) => ({
              ...currentEditor,
              formattingPreferences: preferences
            }))
          }
          updateFormattingAction={updateFormattingAction}
        />

        <ChapterGuidanceStrip chapterId={editorState.chapter?.id ?? null} refreshKey={guidanceRefreshKey} />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr) minmax(260px, 320px)",
            gap: "20px",
            alignItems: "start"
          }}
        >
          <ChapterScenePanel
            scenes={editorState.sceneStack}
            selectedSceneId={selectedLinkedSceneId}
            onSelectScene={setSelectedLinkedSceneId}
            onInsertMarker={insertMarker}
          />

          <section
            style={{
              display: "grid",
              gap: "14px",
              borderRadius: "24px",
              border: "1px solid #d7dfeb",
              backgroundColor: "#ffffff",
              padding: "24px",
              minHeight: "70vh"
            }}
          >
            <div style={{ display: "grid", gap: "8px" }}>
              <strong style={{ fontSize: "18px", color: "#132238" }}>Chapter editor</strong>
              <span style={{ color: "#52637a", lineHeight: 1.6 }}>
                The writing surface keeps structure markers visible without forcing navigation away from the chapter.
              </span>
            </div>

            <textarea
              value={draftText}
              onChange={(event) => handleDraftChange(event.target.value)}
              readOnly={editorState.editorMode === "READ_ONLY"}
              placeholder="Start drafting here..."
              style={{
                width: "100%",
                minHeight: "58vh",
                border: "1px solid #d7dfeb",
                borderRadius: "20px",
                padding: "24px",
                resize: "vertical",
                fontFamily: `${editorState.formattingPreferences.fontFamily}, serif`,
                fontSize: `${editorState.formattingPreferences.fontSize}px`,
                lineHeight: editorState.formattingPreferences.lineHeight,
                color: "#132238",
                backgroundColor: editorState.editorMode === "READ_ONLY" ? "#f5f7fb" : "#fffdfa"
              }}
            />

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: "12px",
                color: "#607287",
                fontSize: "14px"
              }}
            >
              <span>
                {wordLimitRecord.wordCount}/{wordLimitRecord.maxWordCount} words
                {wordLimitRecord.remainingWords >= 0 ? ` • ${wordLimitRecord.remainingWords} remaining` : ""}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <span>{resolveSaveStateLabel()}</span>
                <button
                  type="button"
                  onClick={() => void runSave("MANUAL")}
                  disabled={
                    editorState.editorMode === "READ_ONLY" ||
                    saveLifecycleState === "SAVING_AUTO" ||
                    saveLifecycleState === "SAVING_MANUAL" ||
                    !hasUnsavedChanges
                  }
                  style={{
                    borderRadius: "999px",
                    border: "1px solid #c1ccdd",
                    backgroundColor: "#ffffff",
                    color: "#1a466f",
                    padding: "10px 14px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor:
                      editorState.editorMode === "READ_ONLY" ||
                      saveLifecycleState === "SAVING_AUTO" ||
                      saveLifecycleState === "SAVING_MANUAL" ||
                      !hasUnsavedChanges
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      editorState.editorMode === "READ_ONLY" ||
                      saveLifecycleState === "SAVING_AUTO" ||
                      saveLifecycleState === "SAVING_MANUAL" ||
                      !hasUnsavedChanges
                        ? 0.65
                        : 1
                  }}
                >
                  Save now
                </button>
              </div>
            </div>
            <span style={{ color: "#52637a", fontSize: "14px" }}>{statusMessage}</span>
          </section>

          <aside style={{ display: "grid", gap: "18px", alignContent: "start" }}>
            <ChapterQuickReferences
              references={editorState.quickReferences}
              isCollapsed={isQuickReferencesCollapsed}
              onToggleCollapsed={() => setIsQuickReferencesCollapsed((currentState) => !currentState)}
            />
            <ChapterWorldPanel context={worldContext} />
          </aside>
        </section>
      </section>
    </main>
  );
}
