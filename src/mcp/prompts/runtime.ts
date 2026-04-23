export interface PromptDefinition {
  name: string;
  description: string;
  template: string;
}

const prompts: PromptDefinition[] = [];

export function registerPrompt(prompt: PromptDefinition): void {
  prompts.push(prompt);
}

export function getRegisteredPrompts(): PromptDefinition[] {
  return [...prompts];
}
