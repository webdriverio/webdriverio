import TestMetadata from './metadata.js'

export class BrowserStackSDK {
    /**
     * Attach metadata to the current test run.
     *
     * @param metadata - Metadata object. Must include an `identifier` string
     *   (max 40 characters); calls without a valid identifier are ignored.
     */
    static setTestMetadata(metadata: Record<string, any> = {}) {
        TestMetadata.set(metadata)
    }
}

export default BrowserStackSDK
