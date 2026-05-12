export type NodeCategory =
  | 'entrypoint'
  | 'handler'
  | 'domain'
  | 'contract'
  | 'flow'
  | 'config'
  | 'infrastructure'
  | 'schema'
  | 'document';

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
  // Reserved for future CST-backed TypeScript route/API extraction.
  .register({ id: 'ts_route', category: 'entrypoint', isCanonical: true, isEntrypoint: true, languages: ['typescript', 'javascript'] })
  .register({ id: 'ts_api_endpoint', category: 'handler', isCanonical: true, isEntrypoint: false, languages: ['typescript', 'javascript'] })
  .register({ id: 'ts_component', category: 'handler', isCanonical: true, isEntrypoint: false, languages: ['typescript', 'javascript'] })
  .register({ id: 'ts_hook', category: 'domain', isCanonical: true, isEntrypoint: false, languages: ['typescript', 'javascript'] })
  .register({ id: 'ts_function', category: 'domain', isCanonical: true, isEntrypoint: false, languages: ['typescript', 'javascript'] })
  .register({ id: 'ts_import', category: 'contract', isCanonical: true, isEntrypoint: false, languages: ['typescript', 'javascript'] })
  .register({ id: 'appsettings_section', category: 'config', isCanonical: true, isEntrypoint: false, languages: ['json'] })
  .register({ id: 'appsettings_key', category: 'config', isCanonical: true, isEntrypoint: false, languages: ['json'] })
  .register({ id: 'env_key', category: 'config', isCanonical: true, isEntrypoint: false, languages: ['env'] })
  .register({ id: 'yaml_config_key', category: 'config', isCanonical: true, isEntrypoint: false, languages: ['yaml'] })
  .register({ id: 'json_config_key', category: 'config', isCanonical: true, isEntrypoint: false, languages: ['json'] })
  .register({ id: 'toml_config_key', category: 'config', isCanonical: true, isEntrypoint: false, languages: ['toml'] })
  .register({ id: 'sql_table', category: 'schema', isCanonical: true, isEntrypoint: false, languages: ['sql'] })
  .register({ id: 'sql_view', category: 'schema', isCanonical: true, isEntrypoint: false, languages: ['sql'] })
  .register({ id: 'sql_migration', category: 'schema', isCanonical: true, isEntrypoint: false, languages: ['sql'] })
  .register({ id: 'dockerfile_stage', category: 'infrastructure', isCanonical: true, isEntrypoint: false, languages: ['dockerfile'] })
  .register({ id: 'terraform_resource', category: 'infrastructure', isCanonical: true, isEntrypoint: false, languages: ['terraform'] })
  .register({ id: 'k8s_service', category: 'infrastructure', isCanonical: true, isEntrypoint: false, languages: ['yaml'] })
  .register({ id: 'openapi_path', category: 'contract', isCanonical: true, isEntrypoint: true, languages: ['yaml', 'json'] })
  .register({ id: 'openapi_operation', category: 'contract', isCanonical: true, isEntrypoint: true, languages: ['yaml', 'json'] })
  .register({ id: 'openapi_schema', category: 'schema', isCanonical: true, isEntrypoint: false, languages: ['yaml', 'json'] })
  .register({ id: 'graphql_type', category: 'schema', isCanonical: true, isEntrypoint: false, languages: ['graphql'] })
  .register({ id: 'graphql_query', category: 'contract', isCanonical: true, isEntrypoint: true, languages: ['graphql'] })
  .register({ id: 'graphql_mutation', category: 'contract', isCanonical: true, isEntrypoint: true, languages: ['graphql'] })
  .register({ id: 'doc_section', category: 'document', isCanonical: false, isEntrypoint: false, languages: ['markdown'] })
  .register({ id: 'flow_domain', category: 'flow', isCanonical: false, isEntrypoint: false, defaultExecutionRole: 'informational', languages: ['*'] });
