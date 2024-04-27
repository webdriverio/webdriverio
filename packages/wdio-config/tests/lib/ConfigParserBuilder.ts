import ConfigParser from '../../src/node/ConfigParser.js'
import type { FilePathsAndContents, MockSystemFolderPath } from './MockPathService.js'
import MockPathService from './MockPathService.js'

export default class ConfigParserBuilder {
    #args: any
    #configPath: string
    #f : MockPathService

    public constructor(baseDir: string, configPath: string, args: any, files: FilePathsAndContents = []) {
        this.#args = args
        this.#configPath = configPath
        this.#f = MockPathService.inWorkingDirectoryWithFiles({ cwd: baseDir, files })
        this.withBaseDir(baseDir)
        this.withFiles(files)
    }

    static withBaseDir(baseDir: MockSystemFolderPath, configPath: string, args: any = {}) : ConfigParserBuilder {
        return new ConfigParserBuilder(baseDir, configPath, args)
    }

    withBaseDir(baseDir: MockSystemFolderPath):ConfigParserBuilder {
        this.#f.withCwd(baseDir)
        return this
    }

    withFiles(files : FilePathsAndContents) :ConfigParserBuilder {
        this.#f.withFiles(files)
        return this
    }

    getMocks() {
        return {
            finder: this.#f
        }
    }

    build(): ConfigParser {
        return new ConfigParser(
            this.#configPath,
            this.#args,
            this.#f
        )
    }
}
