import * as WdioSharedStoreService from '../src'
import SharedStoreLauncher from '../src/launcher'
import SharedStoreService from '../src/service'

describe('WdioSharedStoreService exports', () => {
    it('should export service and launcher', async () => {
        expect(WdioSharedStoreService.launcher).toBe(SharedStoreLauncher)
        expect(WdioSharedStoreService.default).toBe(SharedStoreService)
    })
})
