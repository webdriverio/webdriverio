import * as configCmd from './../../src/commands/config'
import { runConfigHelper } from './../../src/utils/runConfigHelper'

jest.mock('./../../src/utils/runConfigHelper')

describe('Command: config', () => {
    it('should call config helper', async () => {
        await configCmd.handler({})

        expect(runConfigHelper).toHaveBeenCalled()
    })

    it('should pass npm flag to config helper', async () => {
        await configCmd.handler({ npm: true })

        expect(runConfigHelper).toHaveBeenCalled()
        expect(runConfigHelper).toHaveBeenCalledWith({ npm: true })
    })
})
