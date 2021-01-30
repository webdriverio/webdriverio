import { PathService } from '../../src/lib/ConfigParser'
import path from 'path'
import { FilePathAndContent } from './MockFileContentBuilder'
var Minimatch = require('minimatch').Minimatch

export type MockSystemFolderPath = string;
export type MockSystemFilePath = string;
export type FilePathsAndContents = [FilePathAndContent][]

/**
 * Test implementation of PathService
 *
 * Avoids the SUT from hitting file system at all, instead using a small in-memory array representing a flat filepath
 * list used as a pseudo directory structure.
 */
export default class MockPathService implements PathService {
    private cwd : MockSystemFolderPath;
    private files : FilePathsAndContents;

    private constructor({ cwd, files } : {cwd: MockSystemFolderPath, files: FilePathsAndContents}) {
        this.cwd = cwd
        this.files = files
        this.getcwdMock = jest.spyOn(this, 'getcwd')
        this.loadFileMock = jest.spyOn(this, 'loadFile')
        this.isFileMock = jest.spyOn(this, 'isFile')
        this.globMock = jest.spyOn(this, 'glob')
    }

    /**
     * Use the mocks if interested in low-level calls being made.
     *
     * A mock for each aspect of PathService is provided.
     */
    getMocks() {
        return {
            getcwdMock : this.getcwdMock,
            loadFileMock : this.loadFileMock,
            isFileMock : this.isFileMock,
            globMock : this.globMock
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
        if ( found ) {
            try {
                // JS's require on JS files auto-parses so let's emulate
                // so that test file values don't matter if they are stringed json or objects
                return JSON.parse(found[1])
            } catch (e) {
                return found[1]
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
