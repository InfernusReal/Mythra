"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";

import type {
  ChapterDetailRecord,
  ChapterResult,
  ChapterWorkspaceRecord
} from "../../../../../src/modules/chapters/chapter.types";

type MilestoneChaptersPageProps = {
  params: Promise<{
    milestoneId: string;
  }>;
  searchParams: Promise<{
    chapterId?: string;
  }>;
};

type ChapterPageState = {
  statusMessage: string;
  workspace: ChapterWorkspaceRecord | null;
  isLoading: boolean;
  isCreatingChapter: boolean;
  isLinkingScenes: boolean;
};

const initialState: ChapterPageState = {
  statusMessage: "Loading chapter workspace...",
  workspace: null,
  isLoading: true,
  isCreatingChapter: false,
  isLinkingScenes: false
};

export default function MilestoneChaptersPage({ params, searchParams }: MilestoneChaptersPageProps) {
  const [milestoneId, setMilestoneId] = useState("");
  const [preferredChapterId, setPreferredChapterId] = useState("");
  const [pageState, setPageState] = useState<ChapterPageState>(initialState);
  const [chapterTitle, setChapterTitle] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);

  useEffect(() => {
    let isCancelled = false;

    async function resolvePageInputs() {
      const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);

      if (!isCancelled) {
        setMilestoneId(resolvedParams.milestoneId);
        setPreferredChapterId(resolvedSearchParams.chapterId ?? "");
      }
    }

    void resolvePageInputs();

    return () => {
      isCancelled = true;
    };
  }, [params, searchParams]);

  useEffect(() => {
    if (!milestoneId) {
      return;
    }

    let isCancelled = false;

    async function loadWorkspace() {
      setPageState((currentState) => ({
        ...currentState,
        isLoading: true,
        statusMessage: "Loading chapter workspace..."
      }));

      try {
        const response = await fetch(`/api/chapters?milestoneId=${milestoneId}`);
        const result = (await response.json()) as ChapterResult<ChapterWorkspaceRecord>;

        if (isCancelled) {
          return;
        }

        if (!result.ok) {
          setPageState((currentState) => ({
            ...currentState,
            isLoading: false,
            statusMessage: result.error.message
          }));
          return;
        }

        startTransition(() => {
          setPageState({
            statusMessage: "Chapter workspace ready.",
            workspace: result.data,
            isLoading: false,
            isCreatingChapter: false,
            isLinkingScenes: false
          });
          setSelectedChapterId((currentChapterId) =>
            currentChapterId.length > 0
              ? currentChapterId
              : preferredChapterId.length > 0
                ? preferredChapterId
                : result.data.chapters[0]?.id ?? ""
          );
        });
      } catch {
        if (!isCancelled) {
          setPageState((currentState) => ({
            ...currentState,
            isLoading: false,
            statusMessage: "The chapter workspace could not be loaded right now."
          }));
        }
      }
    }

    void loadWorkspace();

    return () => {
      isCancelled = true;
    };
  }, [milestoneId, preferredChapterId]);

  const selectedChapterLinks = useMemo(() => {
    if (!pageState.workspace || selectedChapterId.length === 0) {
      return [];
    }

    return pageState.workspace.chapterSceneLinks.filter((link) => link.chapterId === selectedChapterId);
  }, [pageState.workspace, selectedChapterId]);

  async function handleCreateChapter() {
    if (!pageState.workspace) {
      return;
    }

    setPageState((currentState) => ({
      ...currentState,
      isCreatingChapter: true,
      statusMessage: "Creating chapter..."
    }));

    try {
      const response = await fetch("/api/chapters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          milestoneId: pageState.workspace.milestone.id,
          title: chapterTitle
        })
      });
      const result = (await response.json()) as ChapterResult<ChapterDetailRecord>;

      if (!result.ok) {
        setPageState((currentState) => ({
          ...currentState,
          isCreatingChapter: false,
          statusMessage: result.error.message
        }));
        return;
      }

      startTransition(() => {
        setPageState((currentState) => ({
          ...currentState,
          isCreatingChapter: false,
          statusMessage: `Chapter created: ${result.data.chapter.title}`,
          workspace:
            currentState.workspace === null
              ? currentState.workspace
              : {
                  ...currentState.workspace,
                  chapters: [...currentState.workspace.chapters, result.data.chapter]
                }
        }));
        setChapterTitle("");
        setSelectedChapterId(result.data.chapter.id);
      });
    } catch {
      setPageState((currentState) => ({
        ...currentState,
        isCreatingChapter: false,
        statusMessage: "The chapter could not be created right now. Please retry."
      }));
    }
  }

  async function handleLinkScenes() {
    if (selectedChapterId.length === 0 || selectedSceneIds.length === 0) {
      setPageState((currentState) => ({
        ...currentState,
        statusMessage: "Select a chapter and at least one scene before linking."
      }));
      return;
    }

    setPageState((currentState) => ({
      ...currentState,
      isLinkingScenes: true,
      statusMessage: "Linking scenes to chapter..."
    }));

    try {
      const response = await fetch("/api/chapters/link-scenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chapterId: selectedChapterId,
          sceneIds: selectedSceneIds
        })
      });
      const result = (await response.json()) as ChapterResult<ChapterWorkspaceRecord>;

      if (!result.ok) {
        setPageState((currentState) => ({
          ...currentState,
          isLinkingScenes: false,
          statusMessage: result.error.message
        }));
        return;
      }

      startTransition(() => {
        setPageState((currentState) => ({
          ...currentState,
          isLinkingScenes: false,
          statusMessage: "Scenes linked to chapter.",
          workspace: result.data
        }));
        setSelectedSceneIds([]);
      });
    } catch {
      setPageState((currentState) => ({
        ...currentState,
        isLinkingScenes: false,
        statusMessage: "The scenes could not be linked right now. Please retry."
      }));
    }
  }

  if (pageState.isLoading || pageState.workspace === null) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "32px",
          backgroundColor: "#f5f7fb",
          color: "#132238"
        }}
      >
        {pageState.statusMessage}
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor: "#f5f7fb"
      }}
    >
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
            Chapter Foundation
          </p>
          <h1 style={{ margin: 0, fontSize: "32px" }}>{pageState.workspace.milestone.title}</h1>
          <p style={{ margin: 0, color: "#52637a", lineHeight: 1.6 }}>
            Chapters are created here and linked to one or more scenes. This is the bridge from scene planning into
            writing structure.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <Link
              href={`/milestones/${pageState.workspace.milestone.id}`}
              style={{ color: "#1a466f", fontWeight: 700, textDecoration: "none" }}
            >
              Return to milestone detail
            </Link>
            <Link
              href={`/milestones/${pageState.workspace.milestone.id}/scenes`}
              style={{ color: "#1a466f", fontWeight: 700, textDecoration: "none" }}
            >
              Return to scene planning
            </Link>
          </div>
        </header>

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
          <h2 style={{ margin: 0, fontSize: "20px" }}>Create Chapter</h2>
          <input
            value={chapterTitle}
            onChange={(event) => setChapterTitle(event.target.value)}
            placeholder="Chapter title"
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid #c1ccdd",
              fontSize: "16px"
            }}
          />
          <button
            type="button"
            onClick={handleCreateChapter}
            disabled={pageState.isCreatingChapter}
            style={{
              width: "fit-content",
              border: "none",
              borderRadius: "999px",
              backgroundColor: "#1a466f",
              color: "#ffffff",
              padding: "14px 20px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: pageState.isCreatingChapter ? "not-allowed" : "pointer",
              opacity: pageState.isCreatingChapter ? 0.7 : 1
            }}
          >
            {pageState.isCreatingChapter ? "Creating..." : "Create Chapter"}
          </button>
          <p style={{ margin: 0, color: "#52637a" }}>{pageState.statusMessage}</p>
        </section>

        <section
          style={{
            display: "grid",
            gap: "16px"
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px" }}>Existing Chapters</h2>
          {pageState.workspace.chapters.length === 0 ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px dashed #c4d1e5",
                borderRadius: "18px",
                padding: "20px",
                color: "#607287"
              }}
            >
              No chapters exist yet for this milestone.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px"
              }}
            >
              {pageState.workspace.chapters.map((chapter) => (
                <article
                  key={chapter.id}
                  style={{
                    display: "grid",
                    gap: "8px",
                    backgroundColor: chapter.id === selectedChapterId ? "#e7f0fb" : "#ffffff",
                    border: "1px solid #d7dfeb",
                    borderRadius: "18px",
                    padding: "20px"
                  }}
                >
                  <strong style={{ fontSize: "18px" }}>{chapter.title}</strong>
                  <span style={{ color: "#607287" }}>Word count: {chapter.wordCount}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedChapterId(chapter.id)}
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
                    Select Chapter
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
          <h2 style={{ margin: 0, fontSize: "20px" }}>Link Scenes To Chapter</h2>
          <select
            value={selectedChapterId}
            onChange={(event) => setSelectedChapterId(event.target.value)}
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid #c1ccdd",
              fontSize: "16px"
            }}
          >
            <option value="">Select chapter</option>
            {pageState.workspace.chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.title}
              </option>
            ))}
          </select>
          <div
            style={{
              display: "grid",
              gap: "10px"
            }}
          >
            {pageState.workspace.availableScenes.length === 0 ? (
              <span style={{ color: "#607287" }}>No scenes are available yet for linking.</span>
            ) : (
              pageState.workspace.availableScenes.map((scene) => (
                <label
                  key={scene.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 14px",
                    backgroundColor: "#f5f7fb",
                    borderRadius: "14px",
                    color: "#132238"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSceneIds.includes(scene.id)}
                    onChange={(event) =>
                      setSelectedSceneIds((currentSceneIds) =>
                        event.target.checked
                          ? [...currentSceneIds, scene.id]
                          : currentSceneIds.filter((sceneId) => sceneId !== scene.id)
                      )
                    }
                  />
                  <span>{scene.outline}</span>
                </label>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={handleLinkScenes}
            disabled={pageState.isLinkingScenes}
            style={{
              width: "fit-content",
              border: "none",
              borderRadius: "999px",
              backgroundColor: "#1a466f",
              color: "#ffffff",
              padding: "14px 20px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: pageState.isLinkingScenes ? "not-allowed" : "pointer",
              opacity: pageState.isLinkingScenes ? 0.7 : 1
            }}
          >
            {pageState.isLinkingScenes ? "Linking..." : "Link Selected Scenes"}
          </button>
          <div
            style={{
              display: "grid",
              gap: "10px"
            }}
          >
            <strong>Selected Chapter Links</strong>
            {selectedChapterLinks.length === 0 ? (
              <span style={{ color: "#607287" }}>No scenes are linked to the selected chapter yet.</span>
            ) : (
              selectedChapterLinks.map((link) => (
                <div
                  key={link.id}
                  style={{
                    borderRadius: "14px",
                    backgroundColor: "#f5f7fb",
                    padding: "14px 16px",
                    color: "#132238"
                  }}
                >
                  {link.sortOrder}. {link.sceneOutline}
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
