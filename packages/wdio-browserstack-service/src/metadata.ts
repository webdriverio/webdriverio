import { BStackLogger } from './bstackLogger.js'
import { getCentralUser } from './util.js'

type Metadata = Record<string, any>

class TestMetadata {
    private static currentTestRunUuid?: string
    private static metadataByTestRunUuid: Record<string, Metadata> = {}
    private static fallbackMetadata: Metadata = {}

    static setCurrentTestRunUuid(testRunUuid?: string) {
        TestMetadata.currentTestRunUuid = testRunUuid
    }

    static set(metadata: Metadata = {}) {
        if (!getCentralUser().app_lcnc) {
            return
        }

        const testRunIdentifier = metadata.identifier
        if (typeof testRunIdentifier !== 'string') {
            BStackLogger.warn('setTestMetadata: metadata.identifier must be a string.')
            return
        }
        if (testRunIdentifier.length > 40) {
            BStackLogger.warn(`setTestMetadata: identifier "${testRunIdentifier}" exceeds the 40-character limit.`)
            return
        }
        TestMetadata.fallbackMetadata = metadata

        if (TestMetadata.currentTestRunUuid) {
            TestMetadata.metadataByTestRunUuid[TestMetadata.currentTestRunUuid] = metadata
        }
    }

    static get(testRunUuid?: string): Metadata {
        if (!getCentralUser().app_lcnc) {
            return {}
        }

        if (testRunUuid) {
            return TestMetadata.metadataByTestRunUuid[testRunUuid] || TestMetadata.fallbackMetadata || {}
        }

        return TestMetadata.fallbackMetadata || {}
    }

    static reset() {
        TestMetadata.currentTestRunUuid = undefined
        TestMetadata.metadataByTestRunUuid = {}
        TestMetadata.fallbackMetadata = {}
    }
}

export default TestMetadata
