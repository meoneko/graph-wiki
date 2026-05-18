/**
 * library-package preset — for reusable library/package projects.
 * Extends generic-codebase with library-specific policies (public API surface focus).
 */
import type { Preset } from '../PresetResolver.js';

export const libraryPackage: Preset = {
  id: 'library-package',
  extends: 'generic-codebase',
  adapters: [
    { id: 'typescript', language: 'typescript', pattern: '**/*.{ts,tsx,js,jsx}' },
    { id: 'structured-file', language: 'structured', pattern: '**/*.{json,yaml,yml}' },
  ],
  policy: {
    authorityPolicy: {
      canonicalFactRules: [
        {
          id: 'require-export-evidence',
          effect: 'allow',
          factKind: 'function',
          requiredExtractionMethods: ['ast'],
          requiredProvenance: true,
          minConfidence: 0.8,
          priority: 60,
          reason: 'Exported library functions require AST evidence',
        },
        {
          id: 'require-interface-evidence',
          effect: 'allow',
          factKind: 'interface',
          requiredExtractionMethods: ['ast'],
          requiredProvenance: true,
          minConfidence: 0.8,
          priority: 60,
          reason: 'Exported interfaces require AST evidence',
        },
      ],
    },
    graphPolicy: {
      rules: [
        {
          id: 'track-public-api-surface',
          scope: 'workspace',
          description: 'Track public API surface and breaking changes',
        },
      ],
    },
    wikiPolicy: {
      rules: [
        {
          id: 'generate-api-docs',
          description: 'Generate API documentation pages for exported symbols',
        },
      ],
    },
  },
  verification: {
    require_flows: false,
    require_runtime_script_contract: false,
    require_artifact_parity: true,
    min_process_coverage: 0.7,
  },
} as const;
