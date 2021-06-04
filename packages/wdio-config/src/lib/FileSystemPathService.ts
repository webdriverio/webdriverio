
// Main implementation (tests contain other implementations)
import fs from 'fs'
import path from 'path'
import glob from 'glob'

import { PathService } from './ConfigParser.js'

export default class FileSystemPathService implements PathService {
    getcwd(): string {
        const cwd = process.cwd()
        if ( typeof cwd === 'undefined' ) {
            throw new Error('Unable to find current working directory from process')
        }
        return cwd
    }

    loadFile<T>(path: string): T {
        if ( !path) {
            throw new Error('A path is required')
        }
        return require(path)
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
