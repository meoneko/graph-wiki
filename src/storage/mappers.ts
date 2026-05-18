import {
    GraphKind,
    ConfidenceBand,
    GraphNode,
    GraphEdge,
    Provenance,
} from '../core/types.js';

export function mapConfidenceToBand(confidence: string | undefined): ConfidenceBand {
    switch (confidence) {
        case 'AUTHORITATIVE':
            return 'AUTHORITATIVE';
        case 'EXTRACTED':
            return 'EXTRACTED';
        case 'INFERRED':
            return 'INFERRED';
        case 'AMBIGUOUS':
            return 'AMBIGUOUS';
        default:
            throw new Error(`INVALID_GRAPH_STATE: invalid confidence '${confidence ?? 'missing'}'`);
    }
}

export function mapBandToConfidence(band: ConfidenceBand): string {
    return band;
}

export function mapProvenance(prov: any): Provenance {
    if (prov && typeof prov === 'object' && prov.source) {
        return prov as Provenance;
    }
    throw new Error('INVALID_GRAPH_STATE: missing provenance');
}

function mapGraphKind(kind: string | undefined): GraphKind {
    switch (kind) {
        case 'canonical':
        case 'derived':
        case 'exploratory':
        case 'external':
            return kind;
        default:
            throw new Error(`INVALID_GRAPH_STATE: invalid graph_kind '${kind ?? 'missing'}'`);
    }
}

/**
 * Determines the stableKey value from a DB row.
 * stableKey is required (string) for canonical/derived nodes/edges.
 * stableKey is null for exploratory/external nodes/edges.
 * DriftDetector skips null stableKey in baseline comparison.
 */
function mapStableKeyFromDB(raw: any): string | null {
    const graphKind = raw.graph_kind as string | undefined;
    const stableKey = raw.stable_key as string | null | undefined;

    // If the DB has a stable_key value, use it directly
    if (stableKey != null && stableKey !== '') {
        return stableKey;
    }

    // For exploratory/external, null is expected
    if (graphKind === 'exploratory' || graphKind === 'external') {
        return null;
    }

    // For canonical/derived without a stored stable_key, return null
    // (the caller/pipeline is responsible for assigning stable keys during normalization)
    return stableKey ?? null;
}

/**
 * Maps a stableKey value to the DB column format.
 * Stores null for exploratory/external, the string value for canonical/derived.
 */
function mapStableKeyToDB(stableKey: string | null | undefined): string | null {
    return stableKey ?? null;
}

export function mapNodeFromDB(raw: any): GraphNode {
    const graphKind = mapGraphKind(raw.graph_kind);
    return {
        id: raw.id,
        stableKey: mapStableKeyFromDB(raw),
        workspace: raw.workspace,
        project: raw.project,
        type: raw.type,
        label: raw.label,
        source_file: raw.source_file ?? undefined,
        symbol: raw.symbol ?? undefined,
        graph_kind: graphKind,
        confidence_band: mapConfidenceToBand(raw.confidence),
        confidence_score: raw.confidence_score != null ? Number(raw.confidence_score) : undefined,
        provenance: mapProvenance(raw.provenance ? JSON.parse(raw.provenance) : null),
        metadata: raw.metadata ? JSON.parse(raw.metadata) : {},
        trust_level: raw.trust_level ?? undefined,
        created_at: raw.created_at != null ? String(raw.created_at) : undefined,
        updated_at: raw.updated_at ?? undefined,
        // Legacy fields
        http_method: raw.http_method ?? undefined,
        http_path: raw.http_path ?? undefined,
        domain: raw.domain ?? undefined,
        lang_meta: raw.lang_meta ? JSON.parse(raw.lang_meta) : undefined,
    };
}

export function mapEdgeFromDB(raw: any): GraphEdge {
    const graphKind = mapGraphKind(raw.graph_kind);
    return {
        id: raw.id,
        stableKey: mapStableKeyFromDB(raw),
        workspace: raw.workspace,
        from_id: raw.from_id,
        to_id: raw.to_id,
        type: raw.type,
        graph_kind: graphKind,
        confidence_band: mapConfidenceToBand(raw.confidence),
        confidence_score: raw.confidence_score != null ? Number(raw.confidence_score) : undefined,
        provenance: mapProvenance(raw.provenance ? JSON.parse(raw.provenance) : null),
        metadata: raw.metadata ? JSON.parse(raw.metadata) : {},
        trust_level: raw.trust_level ?? undefined,
        created_at: raw.created_at != null ? String(raw.created_at) : undefined,
        updated_at: raw.updated_at ?? undefined,
    };
}

export function mapNodeToDB(node: GraphNode): any {
    return {
        id: node.id,
        stable_key: mapStableKeyToDB(node.stableKey),
        workspace: node.workspace,
        project: node.project,
        label: node.label,
        type: node.type,
        graph_kind: node.graph_kind,
        confidence: mapBandToConfidence(node.confidence_band),
        confidence_score: node.confidence_score ?? null,
        provenance: JSON.stringify(node.provenance),
        metadata: JSON.stringify(node.metadata || {}),
        trust_level: node.trust_level || null,
        updated_at: node.updated_at || null,
        // Optional fields — null-coalesce so better-sqlite3 never sees undefined
        source_file: node.source_file ?? null,
        symbol: node.symbol ?? null,
        http_method: node.http_method || null,
        http_path: node.http_path || null,
        domain: node.domain || null,
        lang_meta: node.lang_meta ? JSON.stringify(node.lang_meta) : null,
    };
}

export function mapEdgeToDB(edge: GraphEdge): any {
    return {
        id: edge.id,
        stable_key: mapStableKeyToDB(edge.stableKey),
        workspace: edge.workspace,
        from_id: edge.from_id,
        to_id: edge.to_id,
        type: edge.type,
        graph_kind: edge.graph_kind,
        confidence: mapBandToConfidence(edge.confidence_band),
        confidence_score: edge.confidence_score ?? null,
        provenance: JSON.stringify(edge.provenance),
        metadata: JSON.stringify(edge.metadata || {}),
        trust_level: edge.trust_level || null,
        updated_at: edge.updated_at || null,
    };
}
