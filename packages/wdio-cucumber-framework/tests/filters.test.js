import { ConfigParser } from '@wdio/config'
import { filterSpecsByTag } from '../src/filters'
import { getTestCases } from '../src/utils'

jest.mock('../src/utils')

describe('filter', () => {
    describe('filterSpecsByTag', () => {
        it('should return filter specs if tagExpression is passed', async () => {
            const config = {
                specs: ['foo/**/*.feature'],
                cucumberOpts: { tagExpression: '@test' }
            }
            ConfigParser.getFilePaths = jest.fn().mockReturnValue([
                'foo/tag.feature',
                'foo/no_tag.feature'
            ])
            getTestCases.mockReturnValue([
                { uri: 'foo/tag.feature' },
                { uri: 'foo/tag.feature' },
            ])
            expect(await filterSpecsByTag(config)).toEqual(['foo/tag.feature'])
        })
        it('should return original specs if tagExpression is not passed', async () => {
            const config = {
                specs: ['foo/**/*.feature'],
                cucumberOpts: { tagExpression: '' }
            }
            expect(await filterSpecsByTag(config)).toBe(config.specs)
        })
    })
})
