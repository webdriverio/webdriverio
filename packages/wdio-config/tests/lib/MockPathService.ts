import path from 'node:path'
import { vi } from 'vitest'
import { Minimatch } from 'minimatch'

import { FilePathAndContent } from './MockFileContentBuilder'
import type { PathService } from '../../src/types'

export type MockSystemFolderPath = string;
export type MockSystemFilePath = string;
export type FilePathsAndContents = FilePathAndContent[]

/**
 * Test implementation of PathService
 *
 * Avoids the SUT from hitting file system at all, instead using a small in-memory array representing a flat filepath
 * list used as a pseudo directory structure.
 */
export default class MockPathService implements PathService {
    private cwd : MockSystemFolderPath
    private files : FilePathsAndContents

    getcwdMock = vi.spyOn(this, 'getcwd' as any)
    loadFileMock = vi.spyOn(this, 'loadFile' as any)
    isFileMock = vi.spyOn(this, 'isFile' as any)
    globMock = vi.spyOn(this, 'glob' as any)

    private constructor({ cwd, files } : {cwd: MockSystemFolderPath, files: FilePathsAndContents}) {
        this.cwd = cwd
        this.files = files
    }

    /**
     * Use the mocks if interested in low-level calls being made.
     *
     * A mock for each aspect of PathService is provided.
     */
    getMocks() {
        return {
            getcwdMock: this.getcwdMock as any as Function,
            loadFileMock: this.loadFileMock as any as Function,
            isFileMock: this.isFileMock as any as Function,
            globMock: this.globMock as any as Function
        }
    }

    withCwd(newCwd: MockSystemFolderPath) {
        this.cwd = newCwd
        return this
    }

    withFiles(newFiles:FilePathsAndContents) {
        this.files = newFiles
        return this
    }

    static inWorkingDirectoryWithFiles({ cwd, files } : {cwd: MockSystemFolderPath, files: FilePathsAndContents}) : MockPathService {
        return new MockPathService({ cwd, files })
    }

    getcwd(): MockSystemFolderPath {
        return this.cwd
    }

    loadFile<T>(filePath: string): T {
        /**
         * Some test values test double slashes in paths
         * which is great, but will fail the simplistic exact string mock file matching,
         * so remove the duplication so this logic should stay simple
         */
        let _path = path.normalize(filePath)
        const filePathKey = this.lookupFilesIndex(_path)
        const found = this.files.find(a => a[0] === filePathKey)
        if (found) {
            try {
                // JS's require on JS files auto-parses so let's emulate
                // so that test file values don't matter if they are stringed json or objects
                return JSON.parse(found[1] as string) as T
            } catch (err: any) {
                return found[1] as T
            }
        }
        throw new Error(`File "${filePathKey}" does not exist in fake file system!`)
    }

    private lookupFilesIndex(filePath: MockSystemFilePath) {
        let _path = path.normalize(filePath)
        return path.isAbsolute(_path) ? _path : path.resolve(this.cwd, _path)
    }

    isFile(filePath: MockSystemFilePath): boolean {
        let _path = path.normalize(filePath)
        const filePathKey = this.lookupFilesIndex(_path)
        return this.files.some(a => a[0] === filePathKey)
    }

    glob(pattern: string): string[] {
        const mm = new Minimatch(pattern)
        return this.files.filter(a => mm.match(a[0])).map(result => result[0])
    }

    ensureAbsolutePath(filepath: string) : string {
        return filepath
    }
}
