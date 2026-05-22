import { describe, it, expect, beforeEach } from 'vitest';
import { registerPrompt, getRegisteredPrompts, type PromptDefinition } from '../../src/mcp/prompts/runtime.js';
import { registerAllPrompts } from '../../src/mcp/prompts/index.js';

describe('MCP Prompts Registry (US-022)', () => {
  beforeEach(() => {
    // Clear registry by emptying the array inside the module or re-registering
    // Since prompts array in runtime.ts is local, registering new ones will append.
    // Let's test the active registration and all default prompts.
  });

  it('allows registering a prompt and retrieving it', () => {
    const customPrompt: PromptDefinition = {
      name: 'test-prompt',
      description: 'A test prompt for validation',
      template: 'Verify that {code} is clean.',
    };

    registerPrompt(customPrompt);
    const prompts = getRegisteredPrompts();
    expect(prompts.some(p => p.name === 'test-prompt')).toBe(true);
    const registered = prompts.find(p => p.name === 'test-prompt');
    expect(registered!.description).toBe(customPrompt.description);
    expect(registered!.template).toBe(customPrompt.template);
  });

  it('registers all default prompts for review workflows', () => {
    registerAllPrompts();
    const prompts = getRegisteredPrompts();

    // Verify presence of default prompts
    const promptNames = prompts.map(p => p.name);
    expect(promptNames).toContain('review-pr');
    expect(promptNames).toContain('explain-impact');
    expect(promptNames).toContain('architecture-summary');
    expect(promptNames).toContain('knowledge-gap');
    expect(promptNames).toContain('refactor-guide');

    // Verify template details for review-pr
    const reviewPr = prompts.find(p => p.name === 'review-pr');
    expect(reviewPr!.description).toBe('Full PR review with impact + risk');
    expect(reviewPr!.template).toContain('Review this PR using graph impact analysis');
  });
});
