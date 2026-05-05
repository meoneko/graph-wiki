import { registerBuildTools } from './build.js';
import { registerQueryTools } from './query.js';
import { registerSearchTools } from './search.js';
import { registerReviewTools } from './review.js';
import { registerGraphTools } from './graph.js';
import { registerWikiTools } from './wiki.js';
import { registerRefactorTools } from './refactor.js';
import { registerPostprocessTools } from './postprocess.js';

export function registerAllTools(): void {
  registerBuildTools();
  registerQueryTools();
  registerSearchTools();
  registerReviewTools();
  registerGraphTools();
  registerWikiTools();
  registerRefactorTools();
  registerPostprocessTools();   // Phase 9.2b: run_postprocess, list_flows, get_flow,
                                //             get_affected_flows, list_communities, get_community,
                                //             get_minimal_context
}
