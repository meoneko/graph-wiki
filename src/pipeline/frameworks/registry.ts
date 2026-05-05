import type { AdapterContext } from '../../core/types.js';
import type { IFrameworkAdapter } from './IFrameworkAdapter.js';

class FrameworkAdapterRegistry {
  private readonly adapters: IFrameworkAdapter[] = [];

  register(adapter: IFrameworkAdapter): void {
    this.adapters.push(adapter);
  }

  async resolve(language: string, context: AdapterContext): Promise<IFrameworkAdapter[]> {
    const matches: IFrameworkAdapter[] = [];
    for (const adapter of this.adapters) {
      if (adapter.language !== language) continue;
      if (await adapter.detectProjectFramework(context)) matches.push(adapter);
    }
    return matches;
  }

  all(): IFrameworkAdapter[] {
    return [...this.adapters];
  }
}

export const globalFrameworkAdapterRegistry = new FrameworkAdapterRegistry();
