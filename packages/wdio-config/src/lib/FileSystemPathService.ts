import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import glob from 'glob'

import RequireLibrary from './RequireLibrary.js'
import type { PathService, ModuleImportService } from '../types'

export default class FileSystemPathService implements PathService {
    constructor(
        private _moduleRequireService: ModuleImportService = new RequireLibrary()
    ) {}

    getcwd(): string {
        const cwd = process.cwd()
        if ( typeof cwd === 'undefined' ) {
            throw new Error('Unable to find current working directory from process')
        }
        return cwd
    }

    loadFile<T>(path: string): Promise<T> {
        if (!path) {
            throw new Error('A path is required')
        }
        return this._moduleRequireService.import<T>(path)
    }

    isFile(filepath: string): boolean {
        return (fs.existsSync(filepath) && fs.lstatSync(filepath).isFile())
    }

    glob(pattern: string): string[] {
        const globResult = glob.sync(pattern) || []
        const fileName = pattern.startsWith('/') ? pattern : path.resolve(this.getcwd(), pattern)
        /**
         * given that glob treats characters like `[` or `{` in a special way
         * and we also want to be able to find files with these characters included
         * we add an additional check to see if the file as pattern exists.
         * add file to globResult only if filename doesn't include pattern(*)
         * and globResult doest contain the fileName
         * and file should be available
         */
        if (!pattern.includes('*') && !globResult.includes(fileName) && fs.existsSync(fileName)) {
            globResult.push(fileName)
        }
        return globResult
    }

    ensureAbsolutePath(filepath: string): string {
        if (filepath.startsWith('file://')) {
            return filepath
        }

        const p = path.isAbsolute(filepath)
            ? path.normalize(filepath)
            : path.resolve(this.getcwd(), filepath)
        return url.pathToFileURL(p).href
    }
}
