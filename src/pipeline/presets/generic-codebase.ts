/**
 * generic-codebase preset — base preset for any codebase.
 * All other presets extend from this unless they specify otherwise.
 */
import type { Preset } from '../PresetResolver.js';

export const genericCodebase: Preset = {
  id: 'generic-codebase',
  adapters: [
    { id: 'typescript', language: 'typescript', pattern: '**/*.{ts,tsx}' },
    { id: 'structured-file', language: 'structured', pattern: '**/*.{json,yaml,yml,toml,env}' },
  ],
  policy: {
    authorityPolicy: {
      canonicalFactRules: [
        {
          id: 'require-parser-provenance',
          effect: 'allow',
          factKind: '*',
          requiredExtractionMethods: ['ast', 'static-analysis'],
          requiredProvenance: true,
          minConfidence: 0.7,
          priority: 50,
          reason: 'Canonical facts require parser-backed extraction with provenance',
        },
        {
          id: 'deny-ai-canonical',
          effect: 'deny',
          factKind: '*',
          requiredExtractionMethods: ['ai'],
          priority: 90,
          reason: 'AI-extracted facts cannot be canonical',
        },
      ],
      canonicalEdgeRules: [
        {
          id: 'require-edge-provenance',
          effect: 'allow',
          edgeKind: '*',
          requiredProvenance: true,
          minConfidence: 0.7,
          priority: 50,
          reason: 'Canonical edges require provenance',
        },
      ],
      ambiguityRules: [
        {
          id: 'multiple-definitions',
          factKind: 'function',
          condition: 'multiple_definitions_same_symbol',
          priority: 50,
          reason: 'Multiple definitions of the same symbol create ambiguity',
        },
      ],
      conflictResolution: {
        priorityRange: [0, 100],
        defaultPriority: 50,
        samePriorityBehavior: 'deny-wins',
        conflictingAllowDenyBehavior: 'deny-wins',
      },
    },
    graphPolicy: {
      rules: [
        {
          id: 'enforce-node-uniqueness',
          scope: 'workspace',
          description: 'Node IDs must be unique within a workspace',
        },
        {
          id: 'require-edge-type',
          scope: 'global',
          description: 'All edges must have a type',
        },
      ],
    },
    askPolicy: {
      rules: [
        {
          id: 'default-canonical-mode',
          defaultMode: 'canonical_only',
          description: 'Default to canonical_only mode for ask queries',
        },
      ],
    },
    wikiPolicy: {
      rules: [
        {
          id: 'no-speculative-content',
          description: 'Wiki pages must not contain speculative content without canonical evidence',
        },
      ],
    },
  },
  verification: {
    require_flows: false,
    require_runtime_script_contract: false,
    require_artifact_parity: false,
    min_process_coverage: 0,
  },
} as const;
