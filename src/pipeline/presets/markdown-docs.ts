/**
 * markdown-docs preset — for documentation-only or docs-heavy projects.
 * Extends generic-codebase with markdown/doc-specific adapters and relaxed policies.
 */
import type { Preset } from '../PresetResolver.js';

export const markdownDocs: Preset = {
  id: 'markdown-docs',
  extends: 'generic-codebase',
  adapters: [
    { id: 'structured-file', language: 'structured', pattern: '**/*.{md,mdx,json,yaml,yml}' },
  ],
  policy: {
    authorityPolicy: {
      canonicalFactRules: [
        {
          id: 'require-doc-parse-provenance',
          effect: 'allow',
          factKind: '*',
          requiredExtractionMethods: ['doc-parse', 'ast', 'static-analysis'],
          requiredProvenance: true,
          minConfidence: 0.6,
          priority: 50,
          reason: 'Documentation facts require doc-parse or parser provenance',
        },
      ],
    },
    graphPolicy: {
      rules: [
        {
          id: 'track-doc-references',
          scope: 'workspace',
          description: 'Track cross-references between documentation pages',
        },
      ],
    },
    wikiPolicy: {
      rules: [
        {
          id: 'no-speculative-content',
          description: 'Wiki pages must not contain speculative content without canonical evidence',
        },
        {
          id: 'preserve-doc-structure',
          description: 'Preserve original document structure in wiki output',
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
