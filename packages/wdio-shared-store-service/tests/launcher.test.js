import { writeFile, deleteFile } from '../src/utils'
import StoreServer from '../src/server'
import SharedStoreLauncher from '../src/launcher'

const { stopServer } = StoreServer.default

jest.mock('../src/server', () => ({
    default: {
        startServer: async () => ({ port: 3000 }),
        stopServer: jest.fn(),
    }
}))
jest.mock('../src/utils', () => ({
    writeFile: jest.fn(),
    deleteFile: jest.fn(),
    getPidPath: pid => pid,
}))

const storeLauncher = new SharedStoreLauncher()

describe('SharedStoreService', () => {
    it('onPrepare', async () => {
        await storeLauncher.onPrepare()
        expect(writeFile).toBeCalledWith(process.pid, 3000)
    })

    it('onComplete', async () => {
        await storeLauncher.onComplete()
        expect(stopServer).toBeCalled()
        expect(deleteFile).toBeCalledWith(process.pid)
    })

    afterEach(() => {
        writeFile.mockClear()
        deleteFile.mockClear()
        stopServer.mockClear()
    })
})
