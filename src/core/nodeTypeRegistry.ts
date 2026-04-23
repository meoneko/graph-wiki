export type NodeCategory = 'entrypoint' | 'handler' | 'domain' | 'contract' | 'flow';

export interface NodeTypeDefinition {
  id: string;
  category: NodeCategory;
  isCanonical: boolean;
  isEntrypoint: boolean;
  defaultExecutionRole?: 'executable' | 'structural_support' | 'informational';
  languages: string[];
}

class NodeTypeRegistry {
  private readonly types = new Map<string, NodeTypeDefinition>();

  register(def: NodeTypeDefinition): this {
    this.types.set(def.id, def);
    return this;
  }

  get(id: string): NodeTypeDefinition | undefined {
    return this.types.get(id);
  }

  isCanonical(id: string): boolean {
    return this.types.get(id)?.isCanonical ?? false;
  }

  isEntrypoint(id: string): boolean {
    return this.types.get(id)?.isEntrypoint ?? false;
  }

  canonicalTypes(): string[] {
    return [...this.types.values()].filter((t) => t.isCanonical).map((t) => t.id);
  }

  forLanguage(language: string): NodeTypeDefinition[] {
    return [...this.types.values()].filter((t) => t.languages.includes(language));
  }

  has(id: string): boolean {
    return this.types.has(id);
  }
}

export const nodeTypeRegistry = new NodeTypeRegistry();

nodeTypeRegistry
  .register({ id: 'csharp_controller_action', category: 'handler', isCanonical: true, isEntrypoint: true, defaultExecutionRole: 'executable', languages: ['csharp'] })
  .register({ id: 'csharp_minimal_api', category: 'entrypoint', isCanonical: true, isEntrypoint: true, defaultExecutionRole: 'executable', languages: ['csharp'] })
  .register({ id: 'csharp_usecase', category: 'domain', isCanonical: true, isEntrypoint: false, defaultExecutionRole: 'structural_support', languages: ['csharp'] })
  .register({ id: 'csharp_dto', category: 'contract', isCanonical: true, isEntrypoint: false, languages: ['csharp'] })
  .register({ id: 'csharp_interface', category: 'contract', isCanonical: false, isEntrypoint: false, languages: ['csharp'] })
  .register({ id: 'csharp_class', category: 'domain', isCanonical: false, isEntrypoint: false, languages: ['csharp'] })
  .register({ id: 'ts_route', category: 'entrypoint', isCanonical: true, isEntrypoint: true, languages: ['typescript', 'javascript'] })
  .register({ id: 'ts_api_endpoint', category: 'handler', isCanonical: true, isEntrypoint: false, languages: ['typescript', 'javascript'] });
