import { registerBuildTools } from './build.js';
import { registerQueryTools } from './query.js';
import { registerSearchTools } from './search.js';
import { registerReviewTools } from './review.js';
import { registerGraphTools } from './graph.js';
import { registerWikiTools } from './wiki.js';
import { registerRefactorTools } from './refactor.js';
import { registerFlowTools } from './flows.js';

export function registerAllTools(): void {
  registerBuildTools();
  registerQueryTools();
  registerSearchTools();
  registerReviewTools();
  registerGraphTools();
  registerWikiTools();
  registerFlowTools();
  registerRefactorTools();
}
