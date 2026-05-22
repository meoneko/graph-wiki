# Exec Plan

## Goal

Provide dynamic business-impact analysis of code edits, sorting affected transaction lines by risk level.

## Scope

- **In Scope**:
  - Implement criticality weighting algorithms inside flow analysis.
  - Implement `get_affected_flows` tool for the MCP server.
  - Expose criticality score ratings via the CLI output during `crg impact`.
- **Out of Scope**:
  - Automatically halting Git commits (this is a reporting surface only).

## Risk Classification

- **Lane**: Normal.
- **Risks**:
  - Extremely long flows could compound high scores falsely.
- **Mitigation**:
  - Normalize scores by applying log-scaling or community-splitting factors to flow length.

## Work Phases

1. **Phase 1**: Define the node-weight mapping matrix.
2. **Phase 2**: Add scoring calculations to the Flow builder.
3. **Phase 3**: Create the inverse affected flow search engine.
4. **Phase 4**: Integrate the tools into the MCP server interface.
