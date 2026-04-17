# Goal.md

## MYTHRA Product Goal and Structured Specification

### 1. Executive Summary

MYTHRA is a structured novel-writing platform designed to make long-form fiction creation fast, structured, and addictive. The system reduces writing friction by guiding users through a clear progression pipeline:

**Idea -> Scene -> Chapter -> Milestone -> Volume -> Novel**

At every layer, the platform provides intelligent structural assistance so users can move from abstract story concepts to clean, readable, high-quality chapters with greater speed, consistency, and control.

### 2. Product Vision

The core vision of MYTHRA is to transform novel creation into a guided, repeatable, high-clarity workflow that preserves creativity while enforcing structural discipline. The product is intended to:

- Reduce the friction involved in writing long-form fiction.
- Convert structured story elements into polished chapter output efficiently.
- Create an engaging workflow that encourages users to continue progressing through their stories.
- Maintain narrative consistency across chapters, milestones, volumes, and the full novel.
- Integrate world-building directly into the writing process rather than treating it as a disconnected reference system.

### 3. Primary Objective

The primary objective of MYTHRA is to enable users to convert structured story elements, including milestones, scenes, and world-building references, into clean, readable, high-quality chapters efficiently.

This objective requires the system to support both creative production and structural enforcement. Users must be able to organize narrative components, connect them to writing outputs, and draft chapters with contextual guidance visible during the writing process.

### 4. System Hierarchy

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

### 5. Core Entity Definitions

#### 5.1 Novel

The **Novel** is the root container of the system.

It is responsible for:

- Holding multiple volumes.
- Serving as the top-level narrative container.
- Persisting novel data in the database.

#### 5.2 Volume

Each **Volume** is a major structural unit within a novel.

Each volume contains:

- A milestones system.
- A world-building system.

Volume interface behavior:

- The volume displays a graph of milestones as cards.
- Each milestone card is clickable.

#### 5.3 Milestone

A **Milestone** represents a major narrative checkpoint within a volume.

Each milestone contains:

- Multiple scenes.
- Completion logic.

Milestone completion rule:

- A milestone is marked **COMPLETE** only when all scenes within that milestone are complete.

Milestone constraints:

- A milestone can define a maximum number of chapters allowed within that milestone.

#### 5.4 Scene

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

#### 5.5 Chapter

A **Chapter** is the writing output unit generated from one or more scenes.

Chapter composition:

- Each chapter is made from one or more scenes.

Scene integration:

- Scenes are hyper-connected to the chapter.

Editor behavior:

- When writing a chapter, connected scenes appear in a side panel.
- The outlines of connected scenes open automatically.

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

Chapter constraints:

- Each chapter can define a maximum word count.
- The maximum word count is a hard limit that prevents further writing after the threshold is reached.

Saving and export:

- Chapters auto-save every few seconds.
- A manual save button must also be available.
- Chapters must be exportable and downloadable as `.doc` files.

### 6. World-Building System

The world-building system is a critical feature of MYTHRA and must be treated as a first-class narrative framework rather than an optional reference layer.

#### 6.1 Layered Structure

World-building is divided into strict hierarchical layers:

1. Layer 1: Space / Universe
2. Layer 2: Planets
3. Layer 3: Kingdoms
4. Layer 4: Organizations
5. Layer 5: Adventure Teams

Each volume has its own world-building system.

#### 6.2 Layer Properties

Each layer contains a tree graph.

Each layer is ordered according to one of the following models:

- **Option A:** Strongest to weakest.
- **Option B:** Fixed absolute cap representing the physical maximum limitation in the novel.

#### 6.3 Node System Per Layer

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

#### 6.4 Forced Interaction System

Users are required to fill the required fields for every node.

If required information is incomplete:

- The system must trigger periodic reminders.
- Reminder frequency should be approximately every one to two days.

#### 6.5 Hyper-Reference System

Any world-building node from any layer can be linked to scenes.

When a user writes a chapter:

- The scene opens in the side panel.
- All world nodes referenced by that scene become visible to the user.

#### 6.6 Layer Invariants

Each layer may define special rules or exceptions.

These invariants are used to establish:

- Unique vibe.
- Constraints.
- Narrative flavor.

### 7. Cross-System Connections

MYTHRA depends on explicit links across all major systems.

#### 7.1 Scene to Chapter

- Scenes are connected to chapters.
- Scenes define the structural foundation of the writing process.

#### 7.2 Scene to World Building

- Scenes reference world-building nodes.

#### 7.3 Milestone to Scene

- Milestones group scenes.

#### 7.4 Volume to World Building

- Each volume owns its own world-building system.

### 8. System Constraints

MYTHRA must enforce structural constraints rather than merely display them.

#### 8.1 Writing Constraints

- Maximum words per chapter must be supported.
- Maximum chapters per milestone must be supported.

#### 8.2 Completion Constraints

- Milestone completion requires all scenes within that milestone to be complete.

#### 8.3 Data Constraints

- Everything must be stored in the database.

### 9. User Flow

The intended user progression is as follows:

1. Create a novel.
2. Create a volume.
3. Define world building, including layers and nodes.
4. Create milestones.
5. Create scene graphs inside milestones.
6. Define scene outlines.
7. Create a chapter.
8. Connect scenes to the chapter.
9. Write with side-panel guidance.
10. Save, auto-save, and export.

This flow should feel natural, sequential, and supportive rather than restrictive.

### 10. System Intent

The system is designed to achieve the following outcomes:

- Eliminate writing friction.
- Enforce structure without killing creativity.
- Guide progression naturally.
- Maintain consistency across large-scale narratives.
- Integrate world-building directly into writing.

### 11. Product Principles

To satisfy the core vision, MYTHRA should operate according to these product principles:

- **Structured progression:** users should always understand the next step in the writing pipeline.
- **Context-rich drafting:** chapters should never be written in isolation from scenes and referenced world data.
- **Constraint-backed creativity:** limits such as chapter size and milestone completion should support consistency, not hinder narrative flow.
- **Direct writing assistance:** the editor should actively surface relevant structural and world-building information during chapter creation.
- **Narrative scalability:** the system must remain coherent as novels expand across multiple volumes, milestones, scenes, and world graphs.

### 12. Functional Summary

MYTHRA must support the following functional capabilities:

- Novel creation and persistence.
- Volume creation and milestone graph display.
- Clickable milestone cards.
- Milestone-level scene organization.
- Scene graph creation and management.
- Mandatory scene outlines.
- Chapter composition from one or more scenes.
- Hyper-connections between scenes and chapters.
- Side-panel surfacing of connected scenes during writing.
- Automatic opening of scene outlines while writing.
- Commands for defining scene start and end boundaries inside a chapter.
- Scene addition and removal within chapters.
- Chapter title, word count, formatting, and structured editing capabilities.
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

### 13. Strategic Outcome

If executed correctly, MYTHRA will function not merely as a writing editor, but as a structured narrative operating system for novel creation. It will guide users from concept to chapter output through a disciplined framework that improves speed, consistency, and engagement while preserving creative freedom.
