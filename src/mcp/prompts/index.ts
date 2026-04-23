import { registerPrompt } from './runtime.js';

export function registerAllPrompts(): void {
  registerPrompt({
    name: 'review-pr',
    description: 'Full PR review with impact + risk',
    template: 'Review this PR using graph impact analysis. Summarize changed nodes, affected entrypoints, risk, and recommendations.',
  });

  registerPrompt({
    name: 'explain-impact',
    description: 'Plain-language blast radius explanation',
    template: 'Explain blast radius in plain language, with upstream/downstream effects and confidence tags.',
  });

  registerPrompt({
    name: 'architecture-summary',
    description: 'System overview from graph communities',
    template: 'Generate architecture summary from communities and cross-domain coupling warnings.',
  });

  registerPrompt({
    name: 'knowledge-gap',
    description: 'Under-documented area analysis',
    template: 'Identify nodes with low connectivity and suggest knowledge gap remediation.',
  });

  registerPrompt({
    name: 'refactor-guide',
    description: 'Graph-aware refactoring recommendations',
    template: 'Provide safe refactor strategy with deterministic blast radius and migration sequencing.',
  });
}
