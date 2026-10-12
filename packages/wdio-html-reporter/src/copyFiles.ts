import fs from 'fs-extra'

export default async function copyFiles(srcDir:string, destDir:string) {
    return await fs.copy(srcDir, destDir)
}

