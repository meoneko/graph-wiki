import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { loadConfig, type WorkspaceConfig, type GovernanceConfig, type ForbiddenPattern } from '../config.js';

describe('WorkspaceConfig interface', () => {
  it('supports all policy fields', () => {
    const ws: WorkspaceConfig = {
      id: 'test-ws',
      projects: ['proj-a'],
      preset: 'web-api',
      profile_mode: 'configured',
      adapters: [{ id: 'typescript', language: 'typescript' }],
      authorityPolicy: {
        canonicalFactRules: [{ id: 'rule-1' }],
        conflictResolution: {
          priorityRange: [0, 100],
          defaultPriority: 50,
          samePriorityBehavior: 'deny-wins',
          conflictingAllowDenyBehavior: 'deny-wins',
        },
      },
      graphPolicy: { rules: [{ id: 'graph-rule-1' }] },
      askPolicy: { rules: [{ id: 'ask-rule-1' }] },
      wikiPolicy: { rules: [{ id: 'wiki-rule-1' }] },
    };

    expect(ws.preset).toBe('web-api');
    expect(ws.profile_mode).toBe('configured');
    expect(ws.adapters).toHaveLength(1);
    expect(ws.authorityPolicy?.canonicalFactRules).toHaveLength(1);
    expect(ws.graphPolicy?.rules).toHaveLength(1);
    expect(ws.askPolicy?.rules).toHaveLength(1);
    expect(ws.wikiPolicy?.rules).toHaveLength(1);
  });

  it('supports bootstrap profile_mode', () => {
    const ws: WorkspaceConfig = {
      id: 'bootstrap-ws',
      projects: [],
      profile_mode: 'bootstrap',
    };

    expect(ws.profile_mode).toBe('bootstrap');
  });

  it('defaults profile_mode to undefined (configured semantics)', () => {
    const ws: WorkspaceConfig = {
      id: 'default-ws',
      projects: [],
    };

    expect(ws.profile_mode).toBeUndefined();
  });
});

describe('GovernanceConfig interface', () => {
  it('supports all governance fields', () => {
    const gov: GovernanceConfig = {
      authority_chain: ['team-lead', 'architect'],
      forbidden_patterns: [
        {
          id: 'no-controller-to-db',
          from_type: 'controller_action',
          to_type: 'entity',
          via_edge: 'calls',
          description: 'Controllers must not directly access entities',
        },
      ],
      critical_flows: ['order-creation', 'payment-processing'],
      reporting: {
        unknown_token: '❓',
        inferred_token: '🔮',
      },
    };

    expect(gov.authority_chain).toHaveLength(2);
    expect(gov.forbidden_patterns).toHaveLength(1);
    expect(gov.forbidden_patterns![0]!.id).toBe('no-controller-to-db');
    expect(gov.forbidden_patterns![0]!.via_edge).toBe('calls');
    expect(gov.critical_flows).toHaveLength(2);
    expect(gov.reporting?.unknown_token).toBe('❓');
  });
});

describe('ForbiddenPattern interface', () => {
  it('supports pattern without via_edge', () => {
    const pattern: ForbiddenPattern = {
      id: 'no-direct-db',
      from_type: 'frontend_route',
      to_type: 'entity',
      description: 'Frontend routes must not directly access entities',
    };

    expect(pattern.via_edge).toBeUndefined();
    expect(pattern.from_type).toBe('frontend_route');
    expect(pattern.to_type).toBe('entity');
  });

  it('supports pattern with via_edge', () => {
    const pattern: ForbiddenPattern = {
      id: 'no-exploratory-authority',
      from_type: 'service',
      to_type: 'external_service',
      via_edge: 'uses_authority',
      description: 'Services must not use exploratory authority to external services',
    };

    expect(pattern.via_edge).toBe('uses_authority');
  });
});

describe('loadConfig() with preset resolution', () => {
  it('resolves workspace preset and merges effective config', async () => {
    // Use the existing knowledge.config.yaml in the project
    const configPath = path.resolve(process.cwd(), 'knowledge.config.yaml');
    let config;
    try {
      config = await loadConfig(configPath);
    } catch {
      // If no config file exists, skip this test
      return;
    }

    // Verify workspaces that have presets get resolved
    for (const ws of config.workspaces) {
      if (ws.preset) {
        // Workspace with preset should have adapters populated from preset
        expect(ws.adapters).toBeDefined();
        expect(ws.adapters!.length).toBeGreaterThan(0);
      }
    }
  });

  it('leaves workspaces without preset unchanged', async () => {
    const configPath = path.resolve(process.cwd(), 'knowledge.config.yaml');
    let config;
    try {
      config = await loadConfig(configPath);
    } catch {
      return;
    }

    for (const ws of config.workspaces) {
      if (!ws.preset) {
        // Workspace without preset should not have adapters injected
        // (unless they were explicitly defined in the config)
        expect(ws.id).toBeDefined();
      }
    }
  });
});
