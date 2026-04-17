# Goal.md

## MYTHRA Product Goal and Structured Specification

### 1. Executive Summary

MYTHRA is a structured novel-writing platform designed to make long-form fiction creation fast, structured, and addictive. The system reduces writing friction by guiding users through a clear progression pipeline:

**Idea -> Scene -> Chapter -> Milestone -> Volume -> Novel**

At every layer, the platform provides intelligent structural assistance so users can move from abstract story concepts to clean, readable, high-quality chapters with greater speed, consistency, and control.

MYTHRA must not present itself primarily as a planning product. It must present itself as the fastest way for a high-output writer to continue writing immediately while structure, continuity, and progression are handled in the background.

### 2. Product Vision

The core vision of MYTHRA is to transform novel creation into a guided, repeatable, high-clarity workflow that preserves creativity while enforcing structural discipline. The product is intended to:

- Reduce the friction involved in writing long-form fiction.
- Convert structured story elements into polished chapter output efficiently.
- Create an engaging workflow that encourages users to continue progressing through their stories.
- Maintain narrative consistency across chapters, milestones, volumes, and the full novel.
- Integrate world-building directly into the writing process rather than treating it as a disconnected reference system.
- Make continuation friction nearly zero for daily writers who need to produce one or two chapters per day.

### 3. Primary Objective

The primary objective of MYTHRA is to enable users to convert structured story elements, including milestones, scenes, and world-building references, into clean, readable, high-quality chapters efficiently.

This objective requires the system to support both creative production and structural enforcement. Users must be able to organize narrative components, connect them to writing outputs, and draft chapters with contextual guidance visible during the writing process.

The product priority is not organizational power for its own sake. The product priority is writing output speed with preserved structure.

### 4. Daily Writer Reality

MYTHRA is built for users whose daily mental model is:

```text
I need to push out one to two chapters today.
```

These users are not opening the product to think about architecture first. They are opening the product to continue writing with as little friction as possible.

Therefore, the product must optimize for:

- Output.
- Speed.
- Immediate continuation.
- Low navigation overhead.
- Background structural support.

MYTHRA should behave according to the following operating rule:

**Zero friction -> high structure -> always ready**

### 5. Core Workflow Principle

Structure must exist before writing begins, not during writing.

This means:

- The system should prepare context before the user starts drafting.
- The system should reduce setup work during daily writing sessions.
- The system should make scene order, chapter progress, and references available automatically.
- The system should avoid forcing users into preparation tasks before they can write.

If the user has to perform repeated setup work every day, the product is failing the core workflow principle.

### 6. System Hierarchy

MYTHRA follows a top-down hierarchical content model:

```text
Novel
  \- Volumes
      |- Milestones
      |   |- Scenes
      |   \- Chapters (composed from scenes)
      \- World Building (layered graph system)
```

This hierarchy defines both information ownership and user progression across the platform.

### 7. Daily Writing Workflow

The primary user experience is the daily writing loop, not the planning surface.

#### 7.1 Entry Point: Today's Writing Queue

When the user opens MYTHRA, the default surface should not be a graph, a dashboard, or a dense control panel.

The default surface should be:

**Today's Writing Queue**

This queue should show:

- The next scenes to write.
- Current milestone progress.
- The suggested next chapter or the active in-progress chapter.

The main action should be a one-click continuation action such as:

**Continue Writing**

The entry experience must immediately answer:

- What am I writing right now?
- Where did I stop?
- What comes next?

#### 7.2 Editor-Centered Workflow

Once the user enters the writing experience, they should not need to leave the editor for normal chapter production.

The editor layout should follow this model:

- Left side or minimal top toggle: Scene Stack.
- Center: Chapter Editor.
- Right side, collapsible: Quick References.

The Scene Stack should show:

- Scene order.
- Scene outlines.
- The current scene.
- The next scene.

The Quick References panel should show:

- Referenced world nodes.
- Supporting notes.
- Lightweight contextual information relevant to the active scene or chapter.

The system should preserve writing flow by keeping all critical context inside the editor.

#### 7.3 Flow Preservation

During writing, the user should be able to:

- Jump between scenes instantly.
- See what happens next.
- Continue writing without navigating away from the chapter workspace.

The system should handle:

- Order.
- Progression.
- Linking.
- Context loading.

The user should feel continuous writing flow with structure, not continuous management of structure.

#### 7.4 Passive Pressure

MYTHRA should guide quality and completeness through subtle, persistent indicators rather than disruptive interruptions.

Examples include:

- Scene has no outline.
- World reference missing.
- Milestone incomplete.

These indicators should:

- Remain visible.
- Avoid modal interruption.
- Avoid breaking typing flow.
- Encourage cleanup without forcing it during active writing.

#### 7.5 End-of-Session Loop

When the user finishes a writing session or completes a chapter draft, the system should provide a concise completion summary.

Example output:

```text
Chapter complete
Milestone progress: 6/10 scenes
2 scenes missing outlines
```

This summary should create:

- Satisfaction.
- Awareness.
- Clear next-step direction.

#### 7.6 Next Scene Suggestion

After a scene is completed or the user reaches a natural structural boundary, MYTHRA should present a clear next-scene suggestion.

Example:

```text
Next: Scene 4 - Conflict escalation
```

This behavior removes the question:

```text
What do I write next?
```

That question creates writing delay and reduces output speed.

#### 7.7 Zero-Friction Continuation

On the next day or next session, the system should reopen directly into continuation context.

Example:

```text
Continue Chapter 12
Next Scene: Ambush Begins
```

The user should be able to click once and resume writing instantly.

The product must avoid:

- Repeated setup.
- Repeated navigation.
- Repeated context reconstruction by the user.

### 8. Core Entity Definitions

#### 8.1 Novel

The **Novel** is the root container of the system.

It is responsible for:

- Holding multiple volumes.
- Serving as the top-level narrative container.
- Persisting novel data in the database.

#### 8.2 Volume

Each **Volume** is a major structural unit within a novel.

Each volume contains:

- A milestones system.
- A world-building system.

Volume interface behavior:

- The volume displays a graph of milestones as cards.
- Each milestone card is clickable.
- The milestone graph is a planning surface, not the primary daily landing experience.

#### 8.3 Milestone

A **Milestone** represents a major narrative checkpoint within a volume.

Each milestone contains:

- Multiple scenes.
- Completion logic.

Milestone completion rule:

- A milestone is marked **COMPLETE** only when all scenes within that milestone are complete.

Milestone constraints:

- A milestone can define a maximum number of chapters allowed within that milestone.

#### 8.4 Scene

A **Scene** is the fundamental narrative planning unit.

Each scene contains:

- A mandatory outline.
- An explanation of what happens in the scene.

Scene graph behavior:

- Scenes exist within a scene graph.
- The graph defines sequence.
- The graph defines transitions.
- The graph defines relationships between scenes.

Scene usage:

- Scenes can be hyper-connected to chapters.
- Scenes should be first-class writing units surfaced directly inside the editor workflow.

#### 8.5 Chapter

A **Chapter** is the writing output unit generated from one or more scenes.

Chapter composition:

- Each chapter is made from one or more scenes.

Scene integration:

- Scenes are hyper-connected to the chapter.

Editor behavior:

- When writing a chapter, connected scenes appear in a side panel.
- The outlines of connected scenes open automatically.
- The writing surface should preserve focus and minimize navigation away from the active draft.

Chapter commands:

- Commands define where each scene starts.
- Commands define where each scene ends.
- Users can add scenes.
- Users can remove scenes.

Chapter features:

- Title.
- Word count.
- Fonts and formatting controls.
- A structured editor intended to feel like Google Docs, but improved for novel-writing workflows.
- Google Docs-like typing continuity, where the editor feels immediate, stable, and low-friction.
- Visible save-state feedback such as `Saving...` and `Saved`.
- Draft restoration behavior if the session reloads unexpectedly.
- Smooth cursor-safe autosave behavior that does not interrupt typing.
- Reliable local protection during temporary network or server failure.

Chapter constraints:

- Each chapter can define a maximum word count.
- The maximum word count is a hard limit that prevents further writing after the threshold is reached.

Saving and export:

- Chapters auto-save every few seconds.
- A manual save button must also be available.
- Typing should feel continuous while autosave happens in the background, similar to Google Docs.
- Autosave should operate optimistically, then reconcile with the server safely.
- If the server is temporarily unavailable, the editor should preserve a local draft and retry safely.
- Save failure should surface as a non-blocking status indicator, not as an intrusive interruption by default.
- Chapters must be exportable and downloadable as `.doc` files.

### 9. Writing Surface Requirements

The editor is the product core. It must behave like a professional writing workspace rather than a generic form.

#### 9.1 Google Docs-Like Expectations

The chapter editor should behave similarly to Google Docs in the following ways:

- Typing should feel immediate.
- Autosave should happen continuously in the background.
- The user should be able to trust that recent work is not easily lost.
- Save state should be visible but lightweight.
- The editor should remain usable while save operations occur.

#### 9.2 Save-State Behavior

The editor should support:

- `Saving...` status during active persistence.
- `Saved` status after successful synchronization.
- Safe retry behavior after transient failure.
- Local draft preservation when remote persistence fails.
- Reload recovery when a draft was recently edited.

#### 9.3 Non-Interruptive Failure Handling

When possible, failures should be handled through:

- Inline status indicators.
- Passive warnings.
- Safe draft preservation.
- Retry mechanisms.

The editor should avoid:

- Aggressive modal interruptions.
- Forced re-entry into the draft.
- Disruptive flows that break concentration.

### 10. World-Building System

The world-building system is a critical feature of MYTHRA and must be treated as a first-class narrative framework rather than an optional reference layer.

#### 10.1 Layered Structure

World-building is divided into strict hierarchical layers:

1. Layer 1: Space / Universe
2. Layer 2: Planets
3. Layer 3: Kingdoms
4. Layer 4: Organizations
5. Layer 5: Adventure Teams

Each volume has its own world-building system.

#### 10.2 Layer Properties

Each layer contains a tree graph.

Each layer is ordered according to one of the following models:

- **Option A:** Strongest to weakest.
- **Option B:** Fixed absolute cap representing the physical maximum limitation in the novel.

#### 10.3 Node System Per Layer

Each node within a layer, such as a kingdom, organization, planet, or adventure team, must define a standard set of required metadata.

Required fields that must be forced input:

- **Position Justification:** why the node deserves its rank.
- **Advantages:** strengths of the node.
- **Disadvantages:** weaknesses of the node.
- **Relationships:** relationships with other nodes, such as kingdoms or empires.
- **Geographical Location:** planet, exact location, and reason for placement.
- **Traditions:** cultural identity and unique behaviors.

Optional field:

- **Exceptions / Special Traits:** unique elements that do not fit other categories, such as trump cards, hidden abilities, or irregular mechanics.

#### 10.4 Forced Interaction System

Users are required to fill the required fields for every node.

If required information is incomplete:

- The system must trigger periodic reminders.
- Reminder frequency should be approximately every one to two days.

#### 10.5 Hyper-Reference System

Any world-building node from any layer can be linked to scenes.

When a user writes a chapter:

- The scene opens in the side panel.
- All world nodes referenced by that scene become visible to the user.

#### 10.6 Layer Invariants

Each layer may define special rules or exceptions.

These invariants are used to establish:

- Unique vibe.
- Constraints.
- Narrative flavor.

### 11. Cross-System Connections

MYTHRA depends on explicit links across all major systems.

#### 11.1 Scene to Chapter

- Scenes are connected to chapters.
- Scenes define the structural foundation of the writing process.

#### 11.2 Scene to World Building

- Scenes reference world-building nodes.

#### 11.3 Milestone to Scene

- Milestones group scenes.

#### 11.4 Volume to World Building

- Each volume owns its own world-building system.

### 12. System Constraints

MYTHRA must enforce structural constraints rather than merely display them.

#### 12.1 Writing Constraints

- Maximum words per chapter must be supported.
- Maximum chapters per milestone must be supported.
- If a workflow slows writing by even a small amount without adding critical value, it should be treated as a product defect and redesigned.

#### 12.2 Completion Constraints

- Milestone completion requires all scenes within that milestone to be complete.

#### 12.3 Data Constraints

- Everything must be stored in the database.
- Critical in-progress chapter text should also support safe short-term local preservation for recovery scenarios.

### 13. User Flow

The intended user progression is as follows:

1. Create a novel.
2. Create a volume.
3. Define world building, including layers and nodes.
4. Create milestones.
5. Create scene graphs inside milestones.
6. Define scene outlines.
7. Create a chapter.
8. Connect scenes to the chapter.
9. Enter the daily writing queue.
10. Continue writing with side-panel guidance.
11. Receive next-scene suggestion and progress feedback.
12. Save, auto-save, and export.

This flow should feel natural, sequential, and supportive rather than restrictive.

### 14. Product Experience Rules

MYTHRA must avoid the following as primary daily-writing behaviors:

- Heavy dashboards.
- Graph-first landing pages.
- Forced setup before each session.
- Modal interruptions during writing.
- Mid-writing mandatory admin tasks.

The product must feel like:

```text
I open it -> I write immediately -> everything stays consistent automatically
```

The system architecture, graphs, and world-building depth are the backbone. The actual product is the writing flow experience.

### 15. System Intent

The system is designed to achieve the following outcomes:

- Eliminate writing friction.
- Enforce structure without killing creativity.
- Guide progression naturally.
- Maintain consistency across large-scale narratives.
- Integrate world-building directly into writing.
- Make structured chapter production feel faster than unstructured drafting.

### 16. Product Principles

To satisfy the core vision, MYTHRA should operate according to these product principles:

- **Structured progression:** users should always understand the next step in the writing pipeline.
- **Context-rich drafting:** chapters should never be written in isolation from scenes and referenced world data.
- **Constraint-backed creativity:** limits such as chapter size and milestone completion should support consistency, not hinder narrative flow.
- **Direct writing assistance:** the editor should actively surface relevant structural and world-building information during chapter creation.
- **Narrative scalability:** the system must remain coherent as novels expand across multiple volumes, milestones, scenes, and world graphs.
- **Writing-first experience:** the fastest path in the product should always be the path back into active writing.
- **Low-interruption guidance:** quality and structure should be enforced through subtle surfaces whenever possible.
- **Continuation-first design:** the system should always know what the user most likely needs to write next.

### 17. Functional Summary

MYTHRA must support the following functional capabilities:

- Novel creation and persistence.
- Today's Writing Queue landing surface.
- One-click continue-writing flow.
- Volume creation and milestone graph display.
- Clickable milestone cards.
- Milestone-level scene organization.
- Scene graph creation and management.
- Mandatory scene outlines.
- Chapter composition from one or more scenes.
- Hyper-connections between scenes and chapters.
- Side-panel surfacing of connected scenes during writing.
- Automatic opening of scene outlines while writing.
- Quick reference panel for world nodes and notes.
- Next-scene suggestion after structural progress points.
- Passive warning indicators for missing outlines, missing references, and incomplete milestone dependencies.
- Commands for defining scene start and end boundaries inside a chapter.
- Scene addition and removal within chapters.
- Chapter title, word count, formatting, and structured editing capabilities.
- Google Docs-like background autosave behavior.
- Save-state indicators such as `Saving...` and `Saved`.
- Draft restoration after reload or transient failure.
- Safe local draft preservation during persistence issues.
- Hard maximum word-count enforcement per chapter.
- Auto-save every few seconds.
- Manual save control.
- `.doc` export.
- Per-volume layered world-building system.
- Tree-graph world-building layers.
- Forced required metadata per world-building node.
- Optional exceptions and special-traits field.
- Reminder system for incomplete required world-building data.
- Hyper-references from world-building nodes to scenes.
- Side-panel visibility of referenced world nodes during chapter writing.
- Layer-specific invariants that shape narrative flavor and constraints.
- Database-backed storage of all system data.

### 18. Strategic Outcome

If executed correctly, MYTHRA will function not merely as a writing editor, but as a structured narrative operating system for novel creation. It will guide users from concept to chapter output through a disciplined framework that improves speed, consistency, and engagement while preserving creative freedom.
