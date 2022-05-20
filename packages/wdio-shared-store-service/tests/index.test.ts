import { describe, expect, it } from 'vitest'

import * as WdioSharedStoreService from '../src'
import SharedStoreLauncher from '../src/launcher'
import SharedStoreService from '../src/service'
import * as SharedStoreClient from '../src/client'

describe('WdioSharedStoreService exports', () => {
    it('should export service and launcher', async () => {
        expect(WdioSharedStoreService.launcher).toBe(SharedStoreLauncher)
        expect(WdioSharedStoreService.default).toBe(SharedStoreService)
    })

    it('should export set and get value handler', () => {
        expect(WdioSharedStoreService.getValue).toBe(SharedStoreClient.getValue)
        expect(WdioSharedStoreService.setValue).toBe(SharedStoreClient.setValue)
    })
})
