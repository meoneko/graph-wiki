/**
 * react-app preset — for React single-page applications.
 * Extends generic-codebase with frontend-specific adapters and policies.
 */
import type { Preset } from '../PresetResolver.js';

export const reactApp: Preset = {
  id: 'react-app',
  extends: 'generic-codebase',
  adapters: [
    { id: 'typescript', language: 'typescript', pattern: '**/*.{ts,tsx,js,jsx}' },
    { id: 'structured-file', language: 'structured', pattern: '**/*.{json,yaml,yml}' },
  ],
  policy: {
    authorityPolicy: {
      canonicalFactRules: [
        {
          id: 'require-component-evidence',
          effect: 'allow',
          factKind: 'react_component',
          requiredExtractionMethods: ['ast'],
          requiredProvenance: true,
          minConfidence: 0.8,
          priority: 60,
          reason: 'React components require AST-based extraction',
        },
        {
          id: 'require-hook-evidence',
          effect: 'allow',
          factKind: 'hook',
          requiredExtractionMethods: ['ast'],
          requiredProvenance: true,
          minConfidence: 0.8,
          priority: 60,
          reason: 'React hooks require AST-based extraction',
        },
      ],
    },
    graphPolicy: {
      rules: [
        {
          id: 'track-component-hierarchy',
          scope: 'workspace',
          description: 'Track parent-child component relationships',
        },
      ],
    },
  },
  verification: {
    require_flows: false,
    require_runtime_script_contract: false,
    require_artifact_parity: false,
    min_process_coverage: 0.3,
  },
} as const;
