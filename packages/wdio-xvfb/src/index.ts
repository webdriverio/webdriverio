import { XvfbManager } from './XvfbManager.js'

// export classes
export { XvfbManager, type XvfbOptions } from './XvfbManager.js'
export { ProcessFactory, type ProcessCreator, type ProcessCreationOptions } from './ProcessFactory.js'

// Export a default instance for convenience
export const xvfb = new XvfbManager()
