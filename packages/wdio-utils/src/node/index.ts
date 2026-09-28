export { startWebDriver } from './startWebDriver.js'
export { setupDriver, setupBrowser } from './manager.js'
export { canAccess } from './utils.js'
export {
    resolveOptionalDependency, importOptionalDependency, MissingDependencyError,
    detectPackageManager, installCommand
} from './optionalDependency.js'
export type { ResolveOptions, ImportOptions, PackageManager } from './optionalDependency.js'
