import TestMetadata from './metadata.js'

export class BrowserStackSDK {
    static setTestMetadata(metadata: Record<string, any> = {}) {
        TestMetadata.set(metadata)
    }
}

export default BrowserStackSDK