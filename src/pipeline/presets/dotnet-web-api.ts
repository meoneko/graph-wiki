/**
 * dotnet-web-api preset — for ASP.NET Core / .NET Web API projects.
 * Extends web-api with C#-specific adapters and policies.
 */
import type { Preset } from '../PresetResolver.js';

export const dotnetWebApi: Preset = {
  id: 'dotnet-web-api',
  extends: 'web-api',
  adapters: [
    { id: 'csharp', language: 'csharp', pattern: '**/*.cs' },
    { id: 'structured-file', language: 'structured', pattern: '**/*.{json,yaml,yml,toml,csproj,sln}' },
  ],
  policy: {
    authorityPolicy: {
      canonicalFactRules: [
        {
          id: 'require-controller-evidence',
          effect: 'allow',
          factKind: 'controller_action',
          requiredExtractionMethods: ['ast', 'static-analysis'],
          requiredProvenance: true,
          minConfidence: 0.85,
          priority: 65,
          reason: 'Controller actions require high-confidence parser evidence in .NET',
        },
      ],
      canonicalEdgeRules: [
        {
          id: 'require-di-edge-provenance',
          effect: 'allow',
          edgeKind: 'invokes',
          requiredProvenance: true,
          minConfidence: 0.75,
          priority: 55,
          reason: 'DI-resolved invocations require provenance',
        },
      ],
    },
  },
  verification: {
    require_flows: true,
    require_runtime_script_contract: true,
    require_artifact_parity: true,
    min_process_coverage: 0.6,
  },
} as const;
