import fs from 'node:fs'
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
        return glob.sync(pattern)
    }

    ensureAbsolutePath(filepath: string): string {
        return path.isAbsolute(filepath) ? path.normalize(filepath) : path.resolve(this.getcwd(), filepath)
    }
}
