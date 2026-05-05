import type { AdapterContext, CandidateRecord } from '../../core/types.js';

export interface IFrameworkAdapter {
  name: string;
  language: string;

  detectProjectFramework(context: AdapterContext): Promise<boolean>;

  enrichCandidates(
    candidates: CandidateRecord[],
    context: AdapterContext,
  ): Promise<CandidateRecord[]>;
}
