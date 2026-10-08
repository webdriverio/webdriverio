import url from 'node:url'
import path from 'node:path'

import { describe, it, expect, vi, afterEach } from 'vitest'

import { makeRelativeToCWD } from '../../src/node/utils.js'

const cwd = path.resolve('/', 'project', 'root')

describe('makeRelativeToCWD', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('resolves a file with a directory from the current working directory', () => {
        vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        expect(makeRelativeToCWD(['./specs/login.spec.js', '../other/login.spec.js'])).toEqual([
            path.resolve(cwd, 'specs', 'login.spec.js'),
            path.resolve(cwd, '..', 'other', 'login.spec.js')
        ])
    })

    it('resolves a glob pattern with a directory from the current working directory (#14447)', () => {
        vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        expect(makeRelativeToCWD(['./specs/*.spec.js', '../other/**/*.spec.js'])).toEqual([
            path.resolve(cwd, 'specs', '*.spec.js'),
            path.resolve(cwd, '..', 'other', '**', '*.spec.js')
        ])
    })

    it('keeps a value without a directory, as it matches spec files by name', () => {
        vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        expect(makeRelativeToCWD(['login', 'login.spec.js', '*.spec.js'])).toEqual(['login', 'login.spec.js', '*.spec.js'])
    })

    it('turns a file URL into a path', () => {
        const file = path.resolve(cwd, 'specs', 'login.spec.js')
        expect(makeRelativeToCWD([url.pathToFileURL(file).href])).toEqual([file])
    })

    it('resolves the values of a group', () => {
        vi.spyOn(process, 'cwd').mockReturnValue(cwd)
        expect(makeRelativeToCWD([['./specs/*.spec.js', 'login']])).toEqual([
            [path.resolve(cwd, 'specs', '*.spec.js'), 'login']
        ])
    })
})
