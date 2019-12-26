import { getPidPath } from '../src/utils'
import { getValue, setValue, setPort } from '../src/client'
import SharedStoreService from '../src/service'

jest.mock('../src/client', () => ({
    getValue: jest.fn(),
    setValue: jest.fn(),
    setPort: jest.fn(),
}))
jest.mock('../src/utils', () => ({
    readFile: () => 44444,
    getPidPath: jest.fn(),
}))

const storeService = new SharedStoreService()

describe('SharedStoreService', () => {
    it('beforeSession', async () => {
        await storeService.beforeSession()
        expect(getPidPath).toBeCalledWith(process.ppid)
        expect(setPort).toBeCalledWith('44444')
    })

    it('beforeSession', () => {
        global.browser = { call: fn => fn() }
        storeService.before()
        global.browser.sharedStore.get('foobar')
        global.browser.sharedStore.set('foo', 'bar')
        expect(getValue).toBeCalledWith('foobar')
        expect(setValue).toBeCalledWith('foo', 'bar')
    })

    afterEach(() => {
        getPidPath.mockClear()
        setPort.mockClear()
        getValue.mockClear()
        setValue.mockClear()
        delete global.browser
    })
})
