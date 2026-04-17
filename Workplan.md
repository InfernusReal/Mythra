# Workplan.md

## MYTHRA Phased Delivery Workplan

### 1. Purpose

This document breaks the MYTHRA product goal into controlled implementation phases. Each phase is limited to no more than two user-facing features so delivery stays testable, reviewable, and safe.

This document does **not** implement code. It defines the order of work, the intended file structure, the expected enterprise code style, and the logging and fallback requirements that must be used during implementation.

### 2. Working Assumptions

- The repository is currently documentation-first and has no application code yet.
- The implementation baseline for planning purposes is an enterprise web application using **Next.js + TypeScript + PostgreSQL + Prisma**.
- If the final stack changes later, the phase boundaries remain valid, but exact file paths may shift.
- Every implementation phase must preserve small scope, explicit logging, and safe fallback behavior.
- The primary product surface is the writing flow, not the planning graph.
- Graphs, world systems, and milestone structures are support systems behind the daily writing experience.

### 3. Engineering Standards

#### 3.1 Recommended Enterprise Folder Structure

```text
app/
  (workspace)/
  api/
src/
  components/
  lib/
    observability/
    guards/
    database/
  modules/
    novels/
    volumes/
    milestones/
    scenes/
    chapters/
    world-building/
tests/
prisma/
docs/
```

#### 3.2 Module Shape Per Domain

Each domain module should follow a consistent vertical-slice structure:

```text
src/modules/<domain>/
  <domain>.types.ts
  <domain>.schema.ts
  <domain>.service.ts
  <domain>.repository.ts
  <domain>.mapper.ts
```

UI and route layers should remain thin. Business rules should live in `service.ts`. Data access should live in `repository.ts`. Runtime validation should live in `schema.ts`.

#### 3.3 Comment Style

Code comments must be short, purposeful, and section-oriented. Avoid narration on trivial lines.

Approved style:

```ts
// Section: Validate request payload before touching persistence
// Section: Persist chapter draft and return a stable response
```

#### 3.4 Logging Convention

For now, logging should exist at every major step. Each log statement must include a unique searchable comment so it can be found quickly during incident review or security fallback tracing.

Approved pattern:

```ts
console.log("[P01][NovelCreate] Request received", { userId }); // SAFETY_LOG:P01_NOVEL_CREATE_REQUEST
console.log("[P01][NovelCreate] Validation passed", { titleLength }); // SAFETY_LOG:P01_NOVEL_CREATE_VALIDATED
console.log("[P01][NovelCreate] Falling back to safe response", { reason }); // SAFETY_LOG:P01_NOVEL_CREATE_FALLBACK
```

#### 3.5 Fallback Safety Pattern

Every mutation flow should use explicit validation, guarded service execution, and a safe user-facing fallback.

Approved pattern:

```ts
try {
  console.log("[P06][ChapterCreate] Starting service flow", { sceneCount }); // SAFETY_LOG:P06_CHAPTER_CREATE_START
  // Section: Run validated business logic only
  return { ok: true, data: chapter };
} catch (error) {
  console.log("[P06][ChapterCreate] Returning safe fallback", { error }); // SAFETY_LOG:P06_CHAPTER_CREATE_FALLBACK
  return { ok: false, error: "Unable to create chapter right now." };
}
```

#### 3.6 Workflow-First Product Rule

Every phase must be reviewed against this rule:

If the feature slows active writing without delivering critical structural value, the feature should be redesigned before implementation.

Daily writer priorities are:

- Resume immediately.
- Stay inside the editor.
- Know what is next.
- Never lose text.

### 4. Phase Overview

| Phase | Features | Output |
| --- | --- | --- |
| 01 | Novel creation, novel persistence | Stable novel root record creation |
| 02 | Volume creation, volume workspace shell | Navigable volume workspace |
| 03 | Milestone graph cards, milestone detail navigation | Internal milestone planning surface |
| 04 | Milestone chapter cap, milestone completion engine | Enforced milestone rules |
| 05 | Scene authoring, scene graph relationships | Structured scene planning layer |
| 06 | Chapter creation, scene-to-chapter linking | Chapter draft foundation |
| 07 | Today's Writing Queue, continue-writing entry | Immediate daily entry point |
| 08 | Chapter editor surface, chapter structure controls | Guided writing workspace |
| 09 | Save lifecycle, chapter word-limit enforcement | Durable and bounded writing flow |
| 10 | Passive pressure indicators, next-scene suggestion | Non-interruptive guidance loop |
| 11 | World-building layer tree, layer rule engine | Structured world foundation |
| 12 | World node metadata enforcement, reminder system | Complete world node discipline |
| 13 | Scene-to-world references, chapter world context panel | Full writing-context integration |
| 14 | Chapter formatting preferences, `.doc` export | Deliverable chapter output |

## 5. Detailed Phases

### Phase 01: Novel Foundation

- **Goal:** Create the root novel object and persist it reliably.
- **Features:** Novel creation, novel persistence.
- **Why this phase exists:** Nothing else can be built safely until the top-level novel container exists in the database and can be retrieved consistently.
- **Scope:** Novel create form, create API, validated write path, database model, success and failure response contract.
- **Files created:**
  - `prisma/schema.prisma`
  - `app/(workspace)/novels/page.tsx`
  - `app/api/novels/route.ts`
  - `src/modules/novels/novel.types.ts`
  - `src/modules/novels/novel.schema.ts`
  - `src/modules/novels/novel.service.ts`
  - `src/modules/novels/novel.repository.ts`
  - `src/lib/observability/console-logger.ts`
  - `tests/novels/novel.service.test.ts`
- **Enterprise code structure:** Thin page, thin route handler, validated service orchestration, repository-only persistence, shared logger utility.
- **Logging and fallback safeties:** Log request receipt, validation pass/fail, database write start, database write success, fallback return. Target `5-7` safety logs.

### Phase 02: Volume Workspace Foundation

- **Goal:** Let a novel own volumes and open a stable workspace shell for each volume.
- **Features:** Volume creation, volume workspace shell.
- **Why this phase exists:** Volumes are the product boundary for milestones and world-building, so they need to exist before downstream planning systems.
- **Scope:** Volume list under a novel, volume create API, volume page shell, guarded parent-child novel lookup.
- **Files created:**
  - `app/(workspace)/novels/[novelId]/volumes/page.tsx`
  - `app/(workspace)/volumes/[volumeId]/page.tsx`
  - `app/api/volumes/route.ts`
  - `src/modules/volumes/volume.types.ts`
  - `src/modules/volumes/volume.schema.ts`
  - `src/modules/volumes/volume.service.ts`
  - `src/modules/volumes/volume.repository.ts`
  - `tests/volumes/volume.service.test.ts`
- **Enterprise code structure:** Parent ownership checks in service layer, page shell separated from list component, no direct database access from UI.
- **Logging and fallback safeties:** Log novel lookup, payload validation, volume creation attempt, missing-parent fallback, success response. Target `5-7` safety logs.

### Phase 03: Milestone Entry Layer

- **Goal:** Introduce milestones as clickable graph cards inside a volume.
- **Features:** Milestone graph cards, milestone detail navigation.
- **Why this phase exists:** Milestones are still required for structural planning, but this is an internal planning surface and not the main daily landing experience.
- **Scope:** Milestone read model, milestone create flow, graph-card rendering, card click navigation into milestone detail.
- **Files created:**
  - `app/(workspace)/volumes/[volumeId]/milestones/page.tsx`
  - `app/(workspace)/milestones/[milestoneId]/page.tsx`
  - `app/api/milestones/route.ts`
  - `src/components/milestones/milestone-graph.tsx`
  - `src/components/milestones/milestone-card.tsx`
  - `src/modules/milestones/milestone.types.ts`
  - `src/modules/milestones/milestone.schema.ts`
  - `src/modules/milestones/milestone.service.ts`
  - `src/modules/milestones/milestone.repository.ts`
  - `tests/milestones/milestone.service.test.ts`
- **Enterprise code structure:** Graph rendering isolated in reusable components, route handler limited to transport mapping, service layer controls navigation-safe data shape.
- **Logging and fallback safeties:** Log volume fetch, milestone list load, graph render data build, navigation target resolution, empty-state fallback. Target `5-8` safety logs.

### Phase 04: Milestone Rule Enforcement

- **Goal:** Enforce milestone limits and completion rules before writing flows begin.
- **Features:** Milestone chapter cap, milestone completion engine.
- **Why this phase exists:** Rule enforcement must land early so scenes and chapters do not create invalid milestone states later.
- **Scope:** Maximum chapter count per milestone, completion status calculator requiring all scenes to be complete, guard clauses around invalid state changes.
- **Files created:**
  - `app/api/milestones/[milestoneId]/rules/route.ts`
  - `src/modules/milestones/milestone-rules.service.ts`
  - `src/modules/milestones/milestone-completion.service.ts`
  - `src/modules/milestones/milestone-rules.types.ts`
  - `src/modules/milestones/milestone-rules.schema.ts`
  - `tests/milestones/milestone-rules.service.test.ts`
  - `tests/milestones/milestone-completion.service.test.ts`
- **Enterprise code structure:** Separate rule engine from core CRUD service so rule evaluation remains independently testable.
- **Logging and fallback safeties:** Log rule evaluation start, scene completion count, chapter cap check, blocked transition, safe error response. Target `5-7` safety logs.

### Phase 05: Scene Planning System

- **Goal:** Add scene authoring and formal graph relationships.
- **Features:** Scene authoring, scene graph relationships.
- **Why this phase exists:** Chapters must be composed from structured scenes rather than ad hoc text blocks.
- **Scope:** Scene create/edit, mandatory outline validation, explanation field, graph edge creation, graph read model for sequencing and transitions.
- **Files created:**
  - `app/(workspace)/milestones/[milestoneId]/scenes/page.tsx`
  - `app/api/scenes/route.ts`
  - `app/api/scenes/graph/route.ts`
  - `src/components/scenes/scene-graph.tsx`
  - `src/components/scenes/scene-form.tsx`
  - `src/modules/scenes/scene.types.ts`
  - `src/modules/scenes/scene.schema.ts`
  - `src/modules/scenes/scene.service.ts`
  - `src/modules/scenes/scene-graph.service.ts`
  - `src/modules/scenes/scene.repository.ts`
  - `tests/scenes/scene.service.test.ts`
  - `tests/scenes/scene-graph.service.test.ts`
- **Enterprise code structure:** Scene entity rules and graph rules must stay separate. Outline validation must be centralized in schema and reused by all mutation handlers.
- **Logging and fallback safeties:** Log scene validation, outline missing failure, graph edge create request, graph rebuild, degraded empty-graph fallback. Target `6-9` safety logs.

### Phase 06: Chapter Draft Foundation

- **Goal:** Create chapters and connect them to one or more scenes.
- **Features:** Chapter creation, scene-to-chapter linking.
- **Why this phase exists:** This phase establishes the structural bridge from planning artifacts to actual writing artifacts.
- **Scope:** Chapter create API, title and base metadata, chapter-scene linking table, safe handling for invalid or duplicate scene connections.
- **Files created:**
  - `app/(workspace)/milestones/[milestoneId]/chapters/page.tsx`
  - `app/api/chapters/route.ts`
  - `app/api/chapters/link-scenes/route.ts`
  - `src/modules/chapters/chapter.types.ts`
  - `src/modules/chapters/chapter.schema.ts`
  - `src/modules/chapters/chapter.service.ts`
  - `src/modules/chapters/chapter-link.service.ts`
  - `src/modules/chapters/chapter.repository.ts`
  - `tests/chapters/chapter.service.test.ts`
  - `tests/chapters/chapter-link.service.test.ts`
- **Enterprise code structure:** Chapter creation and scene linking should be separate services with a shared transaction boundary at the repository layer.
- **Logging and fallback safeties:** Log chapter create start, metadata validation, scene link resolution, duplicate-link prevention, transaction fallback. Target `6-8` safety logs.

### Phase 07: Daily Writing Entry

- **Goal:** Make the product open into immediate writing continuation instead of planning complexity.
- **Features:** Today's Writing Queue, continue-writing entry.
- **Why this phase exists:** This is the main user-facing product surface for high-output writers. The system must answer what to write now before it asks the user to manage structure.
- **Scope:** Queue read model, active chapter resume target, next scenes list, current milestone progress summary, one-click continue-writing action.
- **Files created:**
  - `app/page.tsx`
  - `app/(workspace)/today/page.tsx`
  - `app/api/today/route.ts`
  - `src/components/today/todays-writing-queue.tsx`
  - `src/components/today/continue-writing-card.tsx`
  - `src/modules/queue/today-queue.types.ts`
  - `src/modules/queue/today-queue.service.ts`
  - `src/modules/queue/today-queue.mapper.ts`
  - `tests/queue/today-queue.service.test.ts`
- **Enterprise code structure:** The home route should stay presentation-focused. Queue assembly should happen in a service layer that composes scene, chapter, and milestone signals into a single read model.
- **Logging and fallback safeties:** Log queue assembly start, active draft resolution, next-scene resolution, empty-queue fallback, continue-target fallback. Target `5-8` safety logs.

### Phase 08: Guided Chapter Editor

- **Goal:** Deliver the first guided chapter-writing workspace.
- **Features:** Chapter editor surface, chapter structure controls.
- **Why this phase exists:** Once users can resume instantly, they need a writing surface that feels stable, direct, and Google Docs-like in flow quality.
- **Scope:** Editor shell, scene stack, chapter center editor, collapsible quick-reference panel, auto-open connected scene outlines, scene start markers, scene end markers, add-scene and remove-scene controls.
- **Files created:**
  - `app/(workspace)/chapters/[chapterId]/page.tsx`
  - `src/components/chapters/chapter-editor.tsx`
  - `src/components/chapters/chapter-scene-panel.tsx`
  - `src/components/chapters/chapter-structure-toolbar.tsx`
  - `src/components/chapters/chapter-quick-references.tsx`
  - `src/modules/chapters/chapter-editor.types.ts`
  - `src/modules/chapters/chapter-editor.service.ts`
  - `tests/chapters/chapter-editor.service.test.ts`
- **Enterprise code structure:** Editor UI split into shell, scene stack, quick-reference panel, and toolbar. Structure commands should be mediated by a service layer, not embedded inline in React components.
- **Logging and fallback safeties:** Log chapter load, scene-stack hydrate, quick-reference hydrate, outline auto-open, structure command execution, editor-safe-readonly fallback. Target `6-10` safety logs.

### Phase 09: Writing Durability and Limits

- **Goal:** Make the writing flow durable and bounded.
- **Features:** Save lifecycle, chapter word-limit enforcement.
- **Why this phase exists:** The editor must feel trustworthy. Writers should feel safe typing continuously, with Google Docs-like autosave behavior and strong protection against lost work.
- **Scope:** Autosave timer, manual save action, `Saving...` and `Saved` states, server reconciliation, stale-write handling, local draft preservation, reload recovery, word count enforcement, hard stop behavior.
- **Files created:**
  - `app/api/chapters/[chapterId]/save/route.ts`
  - `src/modules/chapters/chapter-guardrails.service.ts`
  - `src/modules/chapters/chapter-save.service.ts`
  - `src/lib/guards/word-limit.ts`
  - `src/lib/guards/save-conflict.ts`
  - `src/lib/editor/local-draft-store.ts`
  - `tests/chapters/chapter-guardrails.service.test.ts`
  - `tests/chapters/chapter-save.service.test.ts`
- **Enterprise code structure:** Saving and guardrail logic should be isolated from UI state so autosave and manual save share the same validated path. Local-draft protection should live in a dedicated utility rather than inside the component tree.
- **Logging and fallback safeties:** Log autosave trigger, manual save trigger, save-state transition, current word count, threshold breach, stale-write block, local-draft fallback, reload-recovery path. Target `8-12` safety logs.

### Phase 10: Flow Guidance Layer

- **Goal:** Guide writers toward completeness and continuity without interrupting flow.
- **Features:** Passive pressure indicators, next-scene suggestion.
- **Why this phase exists:** Writers need direction and awareness, but not popups or heavy workflow interruptions. Guidance should feel present, not punitive.
- **Scope:** Passive inline indicators for missing outlines, missing references, incomplete milestone signals, next-scene suggestion engine, end-of-session progress summary.
- **Files created:**
  - `app/api/chapters/[chapterId]/guidance/route.ts`
  - `src/components/chapters/chapter-guidance-strip.tsx`
  - `src/components/chapters/next-scene-suggestion.tsx`
  - `src/modules/chapters/chapter-guidance.types.ts`
  - `src/modules/chapters/chapter-guidance.service.ts`
  - `src/modules/scenes/next-scene.service.ts`
  - `tests/chapters/chapter-guidance.service.test.ts`
  - `tests/scenes/next-scene.service.test.ts`
- **Enterprise code structure:** Guidance rules and suggestion rules should be separated from render logic. The UI should consume stable view models and never compute suggestion order itself.
- **Logging and fallback safeties:** Log guidance assembly, missing-outline detection, missing-reference detection, next-scene resolution, no-suggestion fallback, safe summary render. Target `6-10` safety logs.

### Phase 11: World-Building Foundation

- **Goal:** Create the strict world-building hierarchy for each volume.
- **Features:** World-building layer tree, layer rule engine.
- **Why this phase exists:** The writing context must be backed by a structured world model, not loose notes.
- **Scope:** Volume-owned world system, five fixed layers, layer tree UI, ordering mode support, invariant fields for vibe, constraints, and narrative flavor.
- **Files created:**
  - `app/(workspace)/volumes/[volumeId]/world/page.tsx`
  - `app/api/world/layers/route.ts`
  - `src/components/world/world-layer-tree.tsx`
  - `src/components/world/world-layer-panel.tsx`
  - `src/modules/world-building/world-layer.types.ts`
  - `src/modules/world-building/world-layer.schema.ts`
  - `src/modules/world-building/world-layer.service.ts`
  - `src/modules/world-building/world-rule-engine.service.ts`
  - `src/modules/world-building/world.repository.ts`
  - `tests/world-building/world-layer.service.test.ts`
  - `tests/world-building/world-rule-engine.service.test.ts`
- **Enterprise code structure:** Fixed-layer constants should be centralized. Rule-engine logic for ranking mode and invariants should not be embedded in components.
- **Logging and fallback safeties:** Log volume world load, layer bootstrap, ranking mode resolution, invariant parse, empty-tree fallback. Target `6-8` safety logs.

### Phase 12: World Node Discipline

- **Goal:** Force complete world-node data entry and follow-up reminders.
- **Features:** World node metadata enforcement, reminder system.
- **Why this phase exists:** The world-building system only has value if required fields are completed and maintained over time.
- **Scope:** Required node fields, optional special-traits field, validation errors, incomplete-node detection job, reminder scheduling every one to two days.
- **Files created:**
  - `app/api/world/nodes/route.ts`
  - `app/api/world/reminders/route.ts`
  - `src/components/world/world-node-form.tsx`
  - `src/modules/world-building/world-node.types.ts`
  - `src/modules/world-building/world-node.schema.ts`
  - `src/modules/world-building/world-node.service.ts`
  - `src/modules/world-building/world-reminder.service.ts`
  - `src/lib/jobs/reminder-scheduler.ts`
  - `tests/world-building/world-node.service.test.ts`
  - `tests/world-building/world-reminder.service.test.ts`
- **Enterprise code structure:** Validation rules must be strict and centralized. Reminder scheduling should be isolated behind a service or job runner boundary.
- **Logging and fallback safeties:** Log node validation start, missing required field, reminder scan, reminder queued, reminder-safe skip fallback. Target `6-9` safety logs.

### Phase 13: Writing Context Integration

- **Goal:** Connect scenes and chapters to relevant world-building data during writing.
- **Features:** Scene-to-world references, chapter world context panel.
- **Why this phase exists:** This is the phase where MYTHRA becomes a true structured narrative system rather than a set of isolated editors.
- **Scope:** Link world nodes to scenes, resolve linked nodes for chapter context, display referenced nodes in the chapter side panel, safe empty-reference behavior.
- **Files created:**
  - `app/api/scenes/link-world/route.ts`
  - `src/components/chapters/chapter-world-panel.tsx`
  - `src/modules/world-building/world-reference.types.ts`
  - `src/modules/world-building/world-reference.service.ts`
  - `src/modules/scenes/scene-world-link.service.ts`
  - `tests/world-building/world-reference.service.test.ts`
  - `tests/scenes/scene-world-link.service.test.ts`
- **Enterprise code structure:** Reference resolution should be computed in service code and delivered to the editor as a stable read model. The chapter UI should not assemble cross-domain relations itself.
- **Logging and fallback safeties:** Log scene-world lookup, reference resolution, side-panel hydrate, missing-reference fallback, safe panel render. Target `5-8` safety logs.

### Phase 14: Output Delivery

- **Goal:** Make chapters presentable and exportable.
- **Features:** Chapter formatting preferences, `.doc` export.
- **Why this phase exists:** Output quality and portability matter after the writing flow and writing-context systems are already reliable.
- **Scope:** Formatting configuration, editor font preferences, export pipeline, filename sanitation, failed-export fallback response.
- **Files created:**
  - `app/api/chapters/[chapterId]/export/route.ts`
  - `src/components/chapters/chapter-formatting-toolbar.tsx`
  - `src/modules/chapters/chapter-formatting.service.ts`
  - `src/modules/chapters/chapter-export.service.ts`
  - `src/lib/export/doc-exporter.ts`
  - `tests/chapters/chapter-export.service.test.ts`
- **Enterprise code structure:** Formatting preferences should persist as structured metadata. Export generation should be abstracted behind a service and not tied directly to component code.
- **Logging and fallback safeties:** Log export request, formatting payload normalize, document generation start, document generation success, download-safe error fallback. Target `5-8` safety logs.

## 6. Phase Delivery Rules

- No phase may be expanded beyond the two listed features without explicit approval.
- Every phase must end with service tests for the introduced business rules.
- Shared utilities may be introduced only when they are required by the current phase.
- Logging must remain searchable using the `SAFETY_LOG:` comment pattern.
- Fallback paths must return safe responses, safe empty states, or safe read-only states instead of throwing raw runtime errors into the UI.
- The home experience and editor experience must always be evaluated before deeper structural surfaces during prioritization.

## 7. Expected Delivery Behavior

When implementation begins, each phase should follow this exact sequence:

1. Confirm the phase scope.
2. Create only the files listed for that phase, or document why an additional file is required.
3. Implement service-layer rules first.
4. Implement transport and UI layers second.
5. Add searchable safety logs.
6. Add fallback handling for validation, persistence, and rendering failures.
7. Verify that the phase improves or preserves writing speed.
8. Verify with narrow tests before proceeding.

## 8. Pathway Relationship

`Pathway.md` is the execution ledger for this workplan. `Workplan.md` defines what should be built. `Pathway.md` records what was actually built after each completed phase.
