import { getPidPath } from '../src/utils'

describe('utils', () => {
    it('getPidPath should build proper path', () => {
        expect(getPidPath('foo')).toContain('/foo.pid')
    })
})
