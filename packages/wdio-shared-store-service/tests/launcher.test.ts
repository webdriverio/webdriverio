import { writeFile, deleteFile } from '../src/utils'
import SharedStoreLauncher from '../src/launcher'
import StoreServerType from '../src/server'
const StoreServer: typeof StoreServerType = require('../src/server').default

const { stopServer } = StoreServer

jest.mock('../src/server', () => ({
    default: {
        startServer: async () => ({ port: 3000 }),
        stopServer: jest.fn(),
    }
}))
jest.mock('../src/utils', () => ({
    writeFile: jest.fn(),
    deleteFile: jest.fn(),
    getPidPath: (pid: number) => pid,
}))

const storeLauncher = new SharedStoreLauncher()

describe('SharedStoreService', () => {
    it('onPrepare', async () => {
        await storeLauncher.onPrepare()
        expect(writeFile).toBeCalledWith(process.pid, '3000')
    })

    it('onComplete', async () => {
        await storeLauncher.onComplete()
        expect(stopServer).toBeCalled()
        expect(deleteFile).toBeCalledWith(process.pid)
    })

    afterEach(() => {
        (writeFile as jest.Mock).mockClear()
        ;(deleteFile as jest.Mock).mockClear()
        ;(stopServer as jest.Mock).mockClear()
    })
})
