import type { CalledSymbolRef, GraphEdge, GraphNode } from '../../core/types.js';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function leaf(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parts = value.split('.');
  return parts[parts.length - 1] || undefined;
}

function containingClassOf(node: GraphNode): string | undefined {
  const metadata = node.metadata ?? {};
  const langMeta = metadata.lang_meta && typeof metadata.lang_meta === 'object'
    ? metadata.lang_meta as Record<string, unknown>
    : node.lang_meta;
  return asString(langMeta?.containingClass) ?? asString(langMeta?.containing_class);
}

function symbolForms(node: GraphNode): string[] {
  const forms = new Set<string>();
  const symbol = node.symbol;
  const label = node.label;
  const containingClass = containingClassOf(node);

  if (symbol) forms.add(symbol);
  if (label) forms.add(label);
  if (leaf(symbol)) forms.add(leaf(symbol)!);
  if (leaf(label)) forms.add(leaf(label)!);

  if (containingClass) {
    forms.add(containingClass);
    if (symbol) forms.add(`${containingClass}.${symbol}`);
    if (leaf(symbol)) forms.add(`${containingClass}.${leaf(symbol)!}`);
  }

  return [...forms];
}

function uniqueById(nodes: GraphNode[]): GraphNode[] {
  const seen = new Set<string>();
  const unique: GraphNode[] = [];
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    unique.push(node);
  }
  return unique;
}

function concrete(nodes: GraphNode[]): GraphNode[] {
  return nodes.filter((node) => !node.type.toLowerCase().includes('interface'));
}

function hasSymbolForm(node: GraphNode, wanted: string): boolean {
  const wantedLeaf = leaf(wanted);
  return symbolForms(node).some((form) => form === wanted || (wantedLeaf ? form === wantedLeaf : false));
}

export class GraphNodeIndex {
  private readonly forms = new Set<string>();
  private readonly byForm = new Map<string, GraphNode[]>();
  private readonly byFileAndForm = new Map<string, GraphNode[]>();
  private readonly byClassAndForm = new Map<string, GraphNode[]>();

  constructor(nodes: GraphNode[]) {
    for (const node of nodes) {
      const nodeForms = symbolForms(node);
      const containingClass = containingClassOf(node);
      for (const form of symbolForms(node)) {
        this.forms.add(form);
        this.add(this.byForm, form, node);
        if (node.source_file) this.add(this.byFileAndForm, `${node.source_file}\0${form}`, node);
        if (containingClass) this.add(this.byClassAndForm, `${containingClass}\0${form}`, node);
      }
    }
  }

  private add(map: Map<string, GraphNode[]>, key: string, node: GraphNode): void {
    const existing = map.get(key);
    if (existing) {
      existing.push(node);
    } else {
      map.set(key, [node]);
    }
  }

  hasAnyForm(name: string): boolean {
    if (this.forms.has(name)) return true;
    const nameLeaf = leaf(name);
    if (nameLeaf && this.forms.has(nameLeaf)) return true;
    const prefix = name.split('.')[0];
    return Boolean(prefix && this.forms.has(prefix));
  }

  findByForm(name: string): GraphNode[] {
    const out: GraphNode[] = [];
    for (const form of this.lookupForms(name)) {
      out.push(...(this.byForm.get(form) ?? []));
    }
    return uniqueById(out);
  }

  findByFileAndForm(sourceFile: string | undefined, name: string): GraphNode[] {
    if (!sourceFile) return [];
    const out: GraphNode[] = [];
    for (const form of this.lookupForms(name)) {
      out.push(...(this.byFileAndForm.get(`${sourceFile}\0${form}`) ?? []));
    }
    return uniqueById(out);
  }

  findByClassAndForm(className: string | undefined, name: string): GraphNode[] {
    if (!className) return [];
    const out: GraphNode[] = [];
    for (const form of this.lookupForms(name)) {
      out.push(...(this.byClassAndForm.get(`${className}\0${form}`) ?? []));
    }
    return uniqueById(out);
  }

  private lookupForms(name: string): string[] {
    const forms = new Set<string>([name]);
    const nameLeaf = leaf(name);
    if (nameLeaf) forms.add(nameLeaf);
    return [...forms];
  }
}

export function buildNodeBySymbol(nodes: GraphNode[]): Map<string, GraphNode> {
  const index = new Map<string, GraphNode>();
  for (const node of nodes) {
    for (const form of symbolForms(node)) {
      if (!index.has(form)) index.set(form, node);
    }
  }
  return index;
}

export function resolveCalledSymbol(
  callRef: CalledSymbolRef,
  _nodes: GraphNode[],
  nodeBySymbol: Map<string, GraphNode>,
  nodeIndex: GraphNodeIndex,
): GraphNode | undefined {
  const name = callRef.name;
  if (!nodeIndex.hasAnyForm(name)) return undefined;

  if (callRef.qualifiedName && callRef.qualifiedName.includes('.')) {
    const exact = nodeBySymbol.get(callRef.qualifiedName);
    if (exact) return exact;
  }

  const sameFile = nodeIndex.findByFileAndForm(callRef.source_file, name);
  const sameClass = callRef.containingClass
    ? nodeIndex.findByClassAndForm(callRef.containingClass, name)
    : [];
  const scoped = uniqueById([...sameClass, ...sameFile]);
  if (scoped.length === 1) return scoped[0];

  const dotIdx = name.indexOf('.');
  if (dotIdx > 0) {
    const className = name.slice(0, dotIdx);
    const methodName = name.slice(dotIdx + 1);
    const inClass = nodeIndex.findByClassAndForm(className, methodName);
    if (inClass.length === 1) return inClass[0];
  }

  const receiverClass = callRef.receiverType ?? callRef.receiver;
  if (receiverClass && !['this', 'self', 'base'].includes(receiverClass)) {
    const receiverLeaf = leaf(receiverClass) ?? receiverClass;
    const byReceiver = concrete(nodeIndex.findByClassAndForm(receiverLeaf, name));
    if (byReceiver.length === 1) return byReceiver[0];
  }

  const fallback = concrete(nodeIndex.findByForm(name));
  return fallback.length === 1 ? fallback[0] : undefined;
}

export function callMetadata(callRef: CalledSymbolRef, from: GraphNode, to: GraphNode, flowType: 'control' | 'data'): GraphEdge['metadata'] {
  return {
    fromSymbol: from.symbol,
    toSymbol: to.symbol,
    calledName: callRef.name,
    receiver: callRef.receiver,
    receiverType: callRef.receiverType,
    line: callRef.line,
    column: callRef.column,
    flow_type: flowType,
  };
}
