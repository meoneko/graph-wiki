import type { AdapterContext, IProjectAdapter } from '../../core/types.js';

export interface AdapterRegistration {
  name: string;
  pattern: RegExp;
  adapterFactory: () => IProjectAdapter;
}

export interface AdapterResolution {
  name: string;
  adapter: IProjectAdapter;
  filePaths: string[];
}

class AdapterRegistry {
  private readonly registry: AdapterRegistration[] = [];

  register(name: string, pattern: RegExp, adapterFactory: () => IProjectAdapter): void {
    this.registry.push({ name, pattern, adapterFactory });
  }

  resolveAll(_context: AdapterContext, filePaths: string[]): { resolutions: AdapterResolution[]; unmatched: string[] } {
    const matched = new Set<string>();
    const resolutions = this.registry
      .map((entry) => {
        const files = filePaths.filter((p) => entry.pattern.test(p));
        files.forEach((file) => matched.add(file));
        return files.length > 0
          ? { name: entry.name, adapter: entry.adapterFactory(), filePaths: files }
          : undefined;
      })
      .filter((entry): entry is AdapterResolution => Boolean(entry));

    return {
      resolutions,
      unmatched: filePaths.filter((file) => !matched.has(file)),
    };
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
