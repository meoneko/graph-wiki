# Overview

## Current Behavior

Currently, business flows (`src/core/graph/analysis/flows.ts`) are represented as simple sequences of connected nodes. There is no concept of **criticality** (business importance or hazard weight) associated with flows. Consequently, during a Git change review, AI agents and developers cannot easily distinguish between a minor utility change and a critical system flow modification, making risk assessment difficult.

## Target Behavior

Introduce **Flow Criticality and Affected-Flow Lookup**.
1. **Criticality Scoring**: Compute a criticality rating (Low, Medium, High, Critical) for every business flow based on structural metrics: coupling degree of nodes in the flow, count of database operations, external API integration points, and overall blast radius.
2. **Affected-Flow Lookup**: Expose an efficient tool where providing changed file paths or modified symbol IDs returns a sorted list of affected business flows, ranked by their criticality rating, highlighting major business flows at risk.

## Affected Users

- AI Agents evaluating pull requests and drafting code review summaries.
- Developers seeking to understand the system-wide business impact of a change before merging.

## Affected Product Docs

- `SPEC.md` Section 13 (Business Flows & Impact Analysis)

## Non-Goals

- Dynamically testing flows in a QA sandbox.
