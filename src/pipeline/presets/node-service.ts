/**
 * node-service preset — for Node.js backend services (non-API, e.g. workers, queue consumers).
 * Extends generic-codebase with service-specific policies.
 */
import type { Preset } from '../PresetResolver.js';

export const nodeService: Preset = {
  id: 'node-service',
  extends: 'generic-codebase',
  adapters: [
    { id: 'typescript', language: 'typescript', pattern: '**/*.{ts,js}' },
    { id: 'structured-file', language: 'structured', pattern: '**/*.{json,yaml,yml,toml,env}' },
  ],
  policy: {
    authorityPolicy: {
      canonicalFactRules: [
        {
          id: 'require-entrypoint-evidence',
          effect: 'allow',
          factKind: 'entrypoint',
          requiredExtractionMethods: ['ast', 'static-analysis'],
          requiredProvenance: true,
          minConfidence: 0.8,
          priority: 60,
          reason: 'Service entrypoints require parser-backed evidence',
        },
        {
          id: 'require-job-evidence',
          effect: 'allow',
          factKind: 'job',
          requiredExtractionMethods: ['ast', 'static-analysis'],
          requiredProvenance: true,
          minConfidence: 0.75,
          priority: 55,
          reason: 'Job/worker definitions require parser evidence',
        },
      ],
    },
    graphPolicy: {
      rules: [
        {
          id: 'track-event-flows',
          scope: 'workspace',
          description: 'Track event-driven flows between services',
        },
      ],
    },
  },
  verification: {
    require_flows: true,
    require_runtime_script_contract: false,
    require_artifact_parity: false,
    min_process_coverage: 0.4,
  },
} as const;
