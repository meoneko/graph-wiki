import type { AdapterContext, IProjectAdapter } from '../../core/types.js';

export interface AdapterRegistration {
  name: string;
  pattern: RegExp;
  adapterFactory: () => IProjectAdapter;
}

class AdapterRegistry {
  private readonly registry: AdapterRegistration[] = [];

  register(name: string, pattern: RegExp, adapterFactory: () => IProjectAdapter): void {
    this.registry.push({ name, pattern, adapterFactory });
  }

  resolve(context: AdapterContext, filePaths: string[]): IProjectAdapter | undefined {
    const hit = this.registry.find((entry) => filePaths.some((p) => entry.pattern.test(p)));
    if (!hit) return undefined;
    return hit.adapterFactory();
  }

  resolveByName(name: string): IProjectAdapter | undefined {
    const hit = this.registry.find((entry) => entry.name === name);
    return hit?.adapterFactory();
  }

  all(): AdapterRegistration[] {
    return [...this.registry];
  }
}

export const globalAdapterRegistry = new AdapterRegistry();
