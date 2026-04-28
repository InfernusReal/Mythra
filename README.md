# MYTHRA

## Structured Novel Writing Platform

MYTHRA is a workflow-first novel writing system designed to help high-output writers move from story structure to finished chapter output with minimal friction. The product is built around a single operating principle:

```text
Zero friction -> high structure -> always ready
```

The platform is not intended to be a generic notes application or a heavy planning dashboard. Its primary purpose is to make structured chapter writing faster by keeping narrative sequence, scene context, milestone progress, and world-building references available inside the writing flow.

## Product Thesis

Daily fiction writers usually open a writing tool with one immediate goal:

```text
I need to write one or two chapters today.
```

MYTHRA is designed around that reality. Planning systems, world graphs, milestones, and references exist as support infrastructure. The main product experience is the fastest possible path back into active writing.

The intended progression model is:

```text
Idea -> Scene -> Chapter -> Milestone -> Volume -> Novel
```

At every layer, the system preserves structure without forcing the writer to leave the drafting environment during normal chapter production.

## Core Capabilities

- Novel, volume, milestone, scene, chapter, and world-building persistence.
- Today's Writing Queue for immediate continuation.
- Scene-first chapter drafting with connected scene outlines.
- Chapter composition from one or more linked scenes.
- Scene start and end structure controls.
- Autosave, manual save, reload recovery, and stale-write protection.
- Hard chapter word-limit enforcement.
- Passive pressure indicators for missing outlines, missing references, and incomplete milestone state.
- Next-scene suggestion for flow continuity.
- Volume-owned world-building hierarchy with fixed layers.
- Required world-node metadata discipline and reminder scheduling.
- Scene-to-world references surfaced inside the chapter editor.
- Chapter formatting preferences.
- `.doc` chapter export.

## System Hierarchy

```text
Novel
  └── Volumes
      ├── Milestones
      │   ├── Scenes
      │   └── Chapters
      └── World Building
          ├── Space / Universe
          ├── Planets
          ├── Kingdoms
          ├── Organizations
          └── Adventure Teams
```

This hierarchy defines ownership, progression, and context resolution across the application.

## Daily Writing Workflow

MYTHRA prioritizes the daily writing loop over management screens.

1. The writer opens the product.
2. Today's Writing Queue identifies the active or next writing target.
3. The writer continues into the chapter editor.
4. Connected scenes appear as the scene stack.
5. Relevant world references appear in the context panel.
6. Autosave and guardrails protect the writing session.
7. The system suggests the next scene and shows progress without interrupting the writer.

The target experience is:

```text
Open Mythra -> continue writing -> stay consistent automatically
```

## Implementation Status

The delivery plan defined in `Workplan.md` has been implemented through 14 controlled phases and recorded in `Pathway.md`.

| Phase | Name | Delivered Capability |
| --- | --- | --- |
| 01 | Novel Foundation | Root novel creation and persistence |
| 02 | Volume Workspace Foundation | Volume creation and volume workspace shell |
| 03 | Milestone Entry Layer | Milestone graph cards and detail navigation |
| 04 | Milestone Rule Enforcement | Chapter caps and milestone completion rules |
| 05 | Scene Planning System | Scene authoring and scene graph relationships |
| 06 | Chapter Draft Foundation | Chapter creation and scene-to-chapter linking |
| 07 | Daily Writing Entry | Today's Writing Queue and continue-writing entry |
| 08 | Guided Chapter Editor | Editor surface, scene stack, and structure controls |
| 09 | Writing Durability and Limits | Autosave, manual save, recovery, and word limits |
| 10 | Flow Guidance Layer | Passive indicators and next-scene suggestions |
| 11 | World-Building Foundation | Fixed world layers and layer rule engine |
| 12 | World Node Discipline | Required metadata and reminder scheduling |
| 13 | Writing Context Integration | Scene-world links and chapter context panel |
| 14 | Output Delivery | Formatting preferences and `.doc` export |

## Architecture

MYTHRA is implemented as a Next.js application with a service-oriented domain structure.

```text
app/
  (workspace)/
  api/
src/
  components/
  lib/
    database/
    editor/
    export/
    guards/
    jobs/
    observability/
  modules/
    chapters/
    milestones/
    novels/
    queue/
    scenes/
    volumes/
    world-building/
tests/
prisma/
```

### Architectural Rules

- UI components remain presentation-focused.
- API routes remain thin transport boundaries.
- Business rules live in module services.
- Persistence is isolated behind repositories.
- Runtime validation is centralized with schemas.
- Safety logs use searchable `SAFETY_LOG:` markers.
- Fallback paths return safe responses or safe UI states instead of raw crashes.

## Technology Stack

- Next.js 15
- React 19
- TypeScript
- Prisma
- PostgreSQL
- Zod
- Vitest

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a local `.env` file:

```env
DATABASE_URL="postgresql://postgres:devpass@localhost:5432/appdb"
```

The `.env` file is ignored by Git.

### 3. Apply database migrations

```bash
npx prisma migrate dev
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run the development server

```bash
npm run dev -- -p 5180
```

Open:

```text
http://localhost:5180
```

## Main Product Routes

| Route | Purpose |
| --- | --- |
| `/` | Today's Writing Queue |
| `/novels` | Create the root novel |
| `/novels/[novelId]/volumes` | Create and list volumes for a novel |
| `/volumes/[volumeId]` | Volume workspace |
| `/volumes/[volumeId]/milestones` | Milestone planning surface |
| `/volumes/[volumeId]/world` | World-building layer and node surface |
| `/milestones/[milestoneId]/scenes` | Scene planning and scene graph |
| `/milestones/[milestoneId]/chapters` | Chapter creation for a milestone |
| `/chapters/[chapterId]` | Guided chapter editor |

## Quality and Verification

The implemented phases were verified with focused service tests, TypeScript validation, Prisma generation, and production builds during delivery.

Useful commands:

```bash
npm run typecheck
npm test
npm run build
```

## Product Direction

The current implementation establishes the functional foundation: entities, APIs, persistence, writing flow, guidance, world context, autosave, and export. The next major product investment should be a dedicated UI/UX refinement pass, especially around the chapter editor's responsive desktop and mobile layout.

The core system exists. The next step is to make the writing surface feel as fast, focused, and polished as the product vision requires.
