/**
 * mixed-monorepo preset — for monorepos containing multiple project types.
 * Extends generic-codebase with broad adapter coverage and relaxed per-project policies.
 */
import type { Preset } from '../PresetResolver.js';

export const mixedMonorepo: Preset = {
  id: 'mixed-monorepo',
  extends: 'generic-codebase',
  adapters: [
    { id: 'typescript', language: 'typescript', pattern: '**/*.{ts,tsx,js,jsx}' },
    { id: 'csharp', language: 'csharp', pattern: '**/*.cs' },
    { id: 'structured-file', language: 'structured', pattern: '**/*.{json,yaml,yml,toml,env,md,mdx,csproj,sln}' },
  ],
  policy: {
    authorityPolicy: {
      canonicalFactRules: [
        {
          id: 'require-parser-provenance',
          effect: 'allow',
          factKind: '*',
          requiredExtractionMethods: ['ast', 'static-analysis', 'doc-parse'],
          requiredProvenance: true,
          minConfidence: 0.7,
          priority: 50,
          reason: 'Monorepo canonical facts require parser-backed extraction',
        },
      ],
    },
    graphPolicy: {
      rules: [
        {
          id: 'enforce-project-boundaries',
          scope: 'workspace',
          description: 'Enforce project boundary isolation within monorepo',
        },
        {
          id: 'track-cross-project-deps',
          scope: 'workspace',
          description: 'Track cross-project dependencies explicitly',
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
