/**
 * web-api preset — for REST/GraphQL API backends (Node.js/TypeScript).
 * Extends generic-codebase with API-specific adapters and policies.
 */
import type { Preset } from '../PresetResolver.js';

export const webApi: Preset = {
  id: 'web-api',
  extends: 'generic-codebase',
  adapters: [
    { id: 'typescript', language: 'typescript', pattern: '**/*.{ts,tsx}' },
    { id: 'structured-file', language: 'structured', pattern: '**/*.{json,yaml,yml,toml,env}' },
  ],
  policy: {
    authorityPolicy: {
      canonicalFactRules: [
        {
          id: 'require-entrypoint-evidence',
          effect: 'allow',
          factKind: 'api_endpoint',
          requiredExtractionMethods: ['ast', 'static-analysis'],
          requiredProvenance: true,
          minConfidence: 0.8,
          priority: 60,
          reason: 'API endpoints require high-confidence parser evidence',
        },
      ],
      canonicalEdgeRules: [
        {
          id: 'require-route-handler-edge',
          effect: 'allow',
          edgeKind: 'entry_of',
          sourceKind: 'api_endpoint',
          targetKind: 'function',
          requiredProvenance: true,
          minConfidence: 0.8,
          priority: 60,
          reason: 'Route-to-handler edges require high confidence',
        },
      ],
    },
    graphPolicy: {
      rules: [
        {
          id: 'require-entrypoint-flow',
          scope: 'workspace',
          description: 'API endpoints should have at least one flow path',
        },
      ],
    },
  },
  verification: {
    require_flows: true,
    require_runtime_script_contract: false,
    require_artifact_parity: false,
    min_process_coverage: 0.5,
  },
} as const;
