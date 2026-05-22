# Design

## Centrality & Budgeting Algorithm

The explorer processes queried nodes, calculates their weight, and packs them within a target token boundary:

```typescript
export interface ExplorationOptions {
  tokenBudget: number; // e.g. 8000
  centralityWeighting: boolean;
  priorityNodes?: string[]; // nodes to lock in context
}

export interface ContextChunk {
  nodeId: string;
  sourceCode: string;
  tokenCount: number;
  score: number;
}
```

```mermaid
graph TD
    A[Raw Query Results] --> B[Calculate Centrality Score]
    B --> C[Sort Chunks by Centrality Score]
    C --> D[Initialize Empty Context Bundle]
    D --> E{Get Next Chunk}
    E -->|Check Budget| F{Current Tokens + Chunk Tokens <= Budget?}
    F -->|Yes| G[Add to Context Bundle]
    F -->|No| H[Skip Chunk / Stop Packaging]
    G --> I[Format Output Markdown]
    H --> I
```

## Token Estimation Strategy

Use a fast, standard character-to-token ratio approximation (e.g. 1 token ≈ 4 characters) to calculate tokens offline rapidly without introducing external tokenizer binary dependencies like `tiktoken` (which would breach our offline-first principle).

## Alternatives Considered

1. **Exact Tiktoken integration**: Rejected because compiling WASM tiktoken wrappers introduces excessive platform-specific binary dependencies on target environments (especially Windows/ARM configurations).
