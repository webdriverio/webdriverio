export { DisplayServerManager, displayServer, optionsFromConfig } from './DisplayServerManager.js'
export { WaylandDisplayServer } from './WaylandDisplayServer.js'
export { XvfbDisplayServer } from './XvfbDisplayServer.js'
export { startDisplayDaemonFromConfig } from './daemon.js'
export type { RunningDaemon } from './daemon.js'
export type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerOptions,
} from './types.js'

// Legacy exports for backward compatibility (will be removed in v10).
/** @deprecated Use {@link DisplayServerManager} instead. Will be removed in v10. */
export { DisplayServerManager as XvfbManager } from './DisplayServerManager.js'
/** @deprecated Construct {@link DisplayServerManager} directly instead of relying on this lazy singleton. Will be removed in v10. */
export { displayServer as xvfb } from './DisplayServerManager.js'
