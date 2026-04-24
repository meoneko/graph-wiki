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
            return 'EXTRACTED'; // Default for P0
    }
}

export function mapBandToConfidence(band: ConfidenceBand): string {
    return band;
}

export function mapProvenance(prov: any): Provenance {
    if (prov && typeof prov === 'object' && prov.source) {
        return prov as Provenance;
    }
    return {
        source: 'parser',
        artifact_source: 'legacy_load',
        producer_stage: 'migration',
        timestamp: new Date().toISOString(),
    };
}

export function mapNodeFromDB(raw: any): GraphNode {
    return {
        ...raw,
        graph_kind: (raw.graph_kind || 'canonical') as GraphKind,
        confidence_band: mapConfidenceToBand(raw.confidence),
        provenance: mapProvenance(raw.provenance ? JSON.parse(raw.provenance) : null),
        metadata: raw.metadata ? JSON.parse(raw.metadata) : {},
        trust_level: raw.trust_level,
    };
}

export function mapEdgeFromDB(raw: any): GraphEdge {
    return {
        ...raw,
        graph_kind: (raw.graph_kind || 'canonical') as GraphKind,
        confidence_band: mapConfidenceToBand(raw.confidence),
        provenance: mapProvenance(raw.provenance ? JSON.parse(raw.provenance) : null),
        metadata: raw.metadata ? JSON.parse(raw.metadata) : {},
        trust_level: raw.trust_level,
    };
}

export function mapNodeToDB(node: GraphNode): any {
    const { confidence_band, provenance, metadata, ...rest } = node;
    return {
        ...rest,
        confidence: mapBandToConfidence(confidence_band),
        provenance: JSON.stringify(provenance),
        metadata: JSON.stringify(metadata || {}),
        trust_level: node.trust_level || null,
        http_method: node.http_method || null,
        http_path: node.http_path || null,
        domain: node.domain || null,
        lang_meta: node.lang_meta ? JSON.stringify(node.lang_meta) : null,
    };
}

export function mapEdgeToDB(edge: GraphEdge): any {
    const { confidence_band, provenance, metadata, ...rest } = edge;
    return {
        ...rest,
        confidence: mapBandToConfidence(confidence_band),
        provenance: JSON.stringify(provenance),
        metadata: JSON.stringify(metadata || {}),
        trust_level: edge.trust_level || null,
    };
}
