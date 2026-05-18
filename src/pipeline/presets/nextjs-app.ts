/**
 * nextjs-app preset — for Next.js applications (SSR + API routes).
 * Extends react-app with Next.js-specific route and API handling.
 */
import type { Preset } from '../PresetResolver.js';

export const nextjsApp: Preset = {
  id: 'nextjs-app',
  extends: 'react-app',
  adapters: [
    { id: 'typescript', language: 'typescript', pattern: '**/*.{ts,tsx,js,jsx}' },
    { id: 'structured-file', language: 'structured', pattern: '**/*.{json,yaml,yml}' },
  ],
  policy: {
    authorityPolicy: {
      canonicalFactRules: [
        {
          id: 'require-route-evidence',
          effect: 'allow',
          factKind: 'frontend_route',
          requiredExtractionMethods: ['ast', 'static-analysis'],
          requiredProvenance: true,
          minConfidence: 0.8,
          priority: 60,
          reason: 'Next.js routes require parser-backed evidence',
        },
        {
          id: 'require-api-route-evidence',
          effect: 'allow',
          factKind: 'api_endpoint',
          requiredExtractionMethods: ['ast', 'static-analysis'],
          requiredProvenance: true,
          minConfidence: 0.8,
          priority: 60,
          reason: 'Next.js API routes require parser-backed evidence',
        },
      ],
    },
    graphPolicy: {
      rules: [
        {
          id: 'track-page-data-fetching',
          scope: 'workspace',
          description: 'Track data fetching patterns (getServerSideProps, server components)',
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
