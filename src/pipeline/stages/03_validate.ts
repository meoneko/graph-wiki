import { CORE_NODE_KINDS, type CandidateRecord, type NormalizedFact, type RejectedRecord } from '../../core/types.js';
import { GraphDB } from '../../storage/GraphDB.js';
import { TRUST_POLICY_VERSION, TrustClassifier } from '../TrustClassifier.js';

export async function validateFacts(candidates: CandidateRecord[], workspaceId: string, db: GraphDB): Promise<{ facts: NormalizedFact[]; rejects: RejectedRecord[] }> {
  const facts: NormalizedFact[] = [];
  const rejects: RejectedRecord[] = [];

  for (const c of candidates) {
    if (!CORE_NODE_KINDS.includes(c.candidate_type)) {
      rejects.push({
        id: `reject:${c.candidate_id}`,
        workspace: workspaceId,
        project: c.project,
        stage: 'validate',
        reason_code: 'UNKNOWN_NODE_KIND',
        details: `candidate_type=${c.candidate_type}`,
        source_file: c.source_file,
        symbol: c.symbol,
      });
      continue;
    }
    if (!Array.isArray(c.roles)) {
      rejects.push({
        id: `reject:${c.candidate_id}`,
        workspace: workspaceId,
        project: c.project,
        stage: 'validate',
        reason_code: 'INVALID_NODE_ROLES',
        details: 'roles must be an array',
        source_file: c.source_file,
        symbol: c.symbol,
      });
      continue;
    }
    if (!c.language) {
      rejects.push({
        id: `reject:${c.candidate_id}`,
        workspace: workspaceId,
        project: c.project,
        stage: 'validate',
        reason_code: 'MISSING_NODE_LANGUAGE',
        details: 'language is required',
        source_file: c.source_file,
        symbol: c.symbol,
      });
      continue;
    }

    const classification = TrustClassifier.classify(c.extractor);
    const fact: NormalizedFact = {
      ...c,
      lang_meta: {
        ...(c.lang_meta ?? {}),
        extractor: c.extractor,
        trustPolicyVersion: TRUST_POLICY_VERSION,
      },
      fact_id: c.candidate_id,
      status: 'validated',
      trust_level: classification.trust_level,
      decision_status: classification.decision_status,
    };

    facts.push(fact);
  }

  db.upsertFacts(facts);
  return { facts, rejects };
}
