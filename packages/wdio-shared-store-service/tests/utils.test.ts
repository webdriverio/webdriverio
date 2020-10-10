import { getPidPath } from '../src/utils'

describe('utils', () => {
    it('getPidPath should build proper path', () => {
        expect(getPidPath(123)).toContain('123.pid')
    })
})
