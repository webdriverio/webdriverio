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

    static clearCurrentTestRunUuid(testRunUuid?: string) {
        if (!testRunUuid || TestMetadata.currentTestRunUuid === testRunUuid) {
            TestMetadata.currentTestRunUuid = undefined
        }
    }

    static set(metadata: Metadata = {}) {
        if (!getCentralUser().app_lcnc) {
            return
        }

        const testRunIdentifier = metadata.identifier
        if (typeof testRunIdentifier !== 'string' || testRunIdentifier.length > 40) {
            BStackLogger.warn('The metadata object is not valid.')
            return
        }

        // Always update fallback so lookups by a different uuid (e.g. reporter's
        // _tests[fullTitle].uuid vs testHubModule's KEY_TEST_UUID) still resolve.
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
