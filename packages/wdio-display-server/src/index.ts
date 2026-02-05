export { DisplayServerManager, displayServer } from './DisplayServerManager.js'
export { DisplayProcessFactory } from './DisplayProcessFactory.js'
export { WaylandDisplayServer } from './WaylandDisplayServer.js'
export { XvfbDisplayServer } from './XvfbDisplayServer.js'
export type { DisplayServer, DisplayServerOptions, ProcessCreator, ProcessCreationOptions } from './types.js'

// Legacy exports for backward compatibility
export { DisplayServerManager as XvfbManager } from './DisplayServerManager.js'
export { DisplayProcessFactory as ProcessFactory } from './DisplayProcessFactory.js'
export { displayServer as xvfb } from './DisplayServerManager.js'
