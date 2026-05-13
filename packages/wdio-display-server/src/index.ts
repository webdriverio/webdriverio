export { DisplayServerManager, displayServer, optionsFromConfig } from './DisplayServerManager.js'
export { DisplayProcessFactory } from './DisplayProcessFactory.js'
export { WaylandDisplayServer } from './WaylandDisplayServer.js'
export { XvfbDisplayServer } from './XvfbDisplayServer.js'
export { default as launcher } from './launcher.js'
export type { DisplayServerLauncherOptions } from './launcher.js'
export type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerOptions,
    ProcessCreator,
    ProcessCreationOptions,
} from './types.js'

// Legacy exports for backward compatibility (will be removed in v10).
/** @deprecated Use {@link DisplayServerManager} instead. Will be removed in v10. */
export { DisplayServerManager as XvfbManager } from './DisplayServerManager.js'
/** @deprecated Use {@link DisplayProcessFactory} instead. Will be removed in v10. */
export { DisplayProcessFactory as ProcessFactory } from './DisplayProcessFactory.js'
/** @deprecated Construct {@link DisplayServerManager} directly instead of relying on this lazy singleton. Will be removed in v10. */
export { displayServer as xvfb } from './DisplayServerManager.js'
