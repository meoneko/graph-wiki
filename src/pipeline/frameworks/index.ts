import { globalFrameworkAdapterRegistry } from './registry.js';
import { AspNetMinimalApiFrameworkAdapter, AspNetMvcFrameworkAdapter, AspNetWebFormsFrameworkAdapter } from './aspnet.js';

globalFrameworkAdapterRegistry.register(new AspNetMvcFrameworkAdapter());
globalFrameworkAdapterRegistry.register(new AspNetMinimalApiFrameworkAdapter());
globalFrameworkAdapterRegistry.register(new AspNetWebFormsFrameworkAdapter());

export { globalFrameworkAdapterRegistry };
export type { IFrameworkAdapter } from './IFrameworkAdapter.js';
