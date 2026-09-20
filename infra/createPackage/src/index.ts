import fs from 'node:fs'
import path from 'node:path'
import shell from 'shelljs'
import { getRootDir } from '@wdio/repo-utils'

import { buildPackageScaffold, type PackageType } from './templates.js'

export function createPackage(
    packageName: string,
    packageType: PackageType,
    packagesDir = path.join(getRootDir(), 'packages')
) {
    if (packageName === '') {
        throw new Error('Package name can not be empty')
    }

    const scaffold = buildPackageScaffold(packageName, packageType)
    const mainPackageFolder = path.join(packagesDir, scaffold.fullPackageName)
    const srcPackageFolder = path.join(mainPackageFolder, 'src')
    const testsPackageFolder = path.join(mainPackageFolder, 'tests')

    const existingPackages = fs.readdirSync(packagesDir)
        .map(name => path.join(packagesDir, name))
        .filter(source => fs.lstatSync(source).isDirectory())

    if (existingPackages.includes(mainPackageFolder)) {
        throw new Error(`Package '${scaffold.fullPackageName}' already exists. Please choose another name.`)
    }

    const createFile = (file: string, content: string) => {
        shell.touch(file)
        shell.ShellString(content).to(file)
    }

    // create package structure
    ;[mainPackageFolder, srcPackageFolder, testsPackageFolder].map(folder => shell.mkdir(folder))

    // create main folder files
    scaffold.mainPackageFolderFiles.map(file => createFile(path.join(mainPackageFolder, file.name), file.content))

    // create src folder files
    scaffold.srcPackageFolderFiles.map(file => createFile(path.join(srcPackageFolder, file.name), file.content))

    // create tests folder files
    scaffold.testsPackageFolderFiles.map(file => createFile(path.join(testsPackageFolder, file.name), file.content))

    return scaffold
}
