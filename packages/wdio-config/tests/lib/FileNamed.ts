import { MockSystemFilePath } from './MockPathService'
import MockFileContentBuilder, { FilePathAndContent, MockFileContent } from './MockFileContentBuilder'

/**
 * Builder for a virtual file system file
 * @param filename
 * @constructor
 */
export function FileNamed(filename: MockSystemFilePath) {
    function withContents(contents: MockFileContent) : FilePathAndContent {
        return [
            filename, contents
        ]
    }
    return { withContents }
}

export type RealSystemPath = string;

/**
 * Mock a real config file by loading it in from the file system.
 *
 * @param f
 */
export async function realRequiredFilePair(f: RealSystemPath) : Promise<FilePathAndContent> {
    return FileNamed(f)
        .withContents(
            (await MockFileContentBuilder.FromRealConfigFile(f)).build()
        )
}

/**
 * Mock a real file, without parsing it (allowing other languages, binary, etc)
 *
 * @param f
 */
export function realReadFilePair(f: RealSystemPath) : FilePathAndContent {
    return FileNamed(f).withContents(MockFileContentBuilder.FromRealDataFile(f))
}
