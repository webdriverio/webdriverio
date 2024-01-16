import url from 'node:url'
import yauzl from 'yauzl'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import got from 'got'

import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { PercyLogger } from './PercyLogger.js'
import type { Options } from '@wdio/types'

class PercyBinary {
    #hostOS = process.platform
    #httpPath: any = null
    #binaryName = 'percy'

    #orderedPaths = [
        path.join(os.homedir(), '.browserstack'),
        process.cwd(),
        os.tmpdir()
    ]

    constructor() {
        const base = 'https://github.com/percy/cli/releases/latest/download'
        if (this.#hostOS.match(/darwin|mac os/i)) {
            this.#httpPath = base + '/percy-osx.zip'
        } else if (this.#hostOS.match(/mswin|msys|mingw|cygwin|bccwin|wince|emc|win32/i)) {
            this.#httpPath = base + '/percy-win.zip'
            this.#binaryName = 'percy.exe'
        } else {
            this.#httpPath = base + '/percy-linux.zip'
        }
    }

    async #makePath(path: string) {
        if (await this.#checkPath(path)) {
            return true
        }
        return fsp.mkdir(path).then(() => true).catch(() => false)
    }

    async #checkPath(path: string) {
        try {
            const hasDir = await fsp.access(path).then(() => true, () => false)
            if (hasDir) {
                return true
            }
        } catch (err) {
            return false
        }
    }

    async #getAvailableDirs() {
        for (let i = 0; i < this.#orderedPaths.length; i++) {
            const path = this.#orderedPaths[i]
            if (await this.#makePath(path)) {
                return path
            }
        }
        throw new Error('Error trying to download percy binary')
    }

    async getBinaryPath(conf: Options.Testrunner): Promise<string> {
        const destParentDir = await this.#getAvailableDirs()
        const binaryPath = path.join(destParentDir, this.#binaryName)
        if (await this.#checkPath(binaryPath)) {
            return binaryPath
        }
        const downloadedBinaryPath: string = await this.download(conf, destParentDir)
        const isValid = await this.validateBinary(downloadedBinaryPath)
        if (!isValid) {
            // retry once
            PercyLogger.error('Corrupt percy binary, retrying')
            return await this.download(conf, destParentDir)
        }
        return downloadedBinaryPath
    }

    async validateBinary(binaryPath: string) {
        const versionRegex = /^.*@percy\/cli \d.\d+.\d+/
        /* eslint-disable @typescript-eslint/no-unused-vars */
        return new Promise((resolve, reject) => {
            const proc = spawn(binaryPath, ['--version'])
            proc.stdout.on('data', (data) => {
                if (versionRegex.test(data)) {
                    resolve(true)
                }
            })

            proc.on('close', () => {
                resolve(false)
            })
        })
    }

    async download(conf: any, destParentDir: any): Promise<string> {
        if (!await this.#checkPath(destParentDir)){
            await fsp.mkdir(destParentDir)
        }
        const binaryName = this.#binaryName
        const zipFilePath = path.join(destParentDir, binaryName + '.zip')
        const binaryPath = path.join(destParentDir, binaryName)
        const downloadedFileStream = fs.createWriteStream(zipFilePath)

        const options: any = url.parse(this.#httpPath)

        return new Promise((resolve, reject) => {
            const stream = got.extend({ followRedirect: true }).get(this.#httpPath, { isStream: true })
            stream.on('error', (err) => {
                PercyLogger.error('Got Error in percy binary download response: ' + err)
            })

            stream.pipe(downloadedFileStream)
                .on('finish', () => {
                    yauzl.open(zipFilePath, { lazyEntries: true }, function (err, zipfile) {
                        if (err) {
                            return reject(err)
                        }
                        zipfile.readEntry()
                        zipfile.on('entry', (entry) => {
                            if (/\/$/.test(entry.fileName)) {
                                // Directory file names end with '/'.
                                zipfile.readEntry()
                            } else {
                                // file entry
                                const writeStream = fs.createWriteStream(
                                    path.join(destParentDir, entry.fileName)
                                )
                                zipfile.openReadStream(entry, function (zipErr, readStream) {
                                    if (zipErr) {
                                        reject(err)
                                    }
                                    readStream.on('end', function () {
                                        writeStream.close()
                                        zipfile.readEntry()
                                    })
                                    readStream.pipe(writeStream)
                                })

                                if (entry.fileName === binaryName) {
                                    zipfile.close()
                                }
                            }
                        })

                        zipfile.on('error', (zipErr) => {
                            reject(zipErr)
                        })

                        zipfile.once('end', () => {
                            fs.chmod(binaryPath, '0755', function (zipErr: any) {
                                if (zipErr) {
                                    reject(zipErr)
                                }
                                resolve(binaryPath)
                            })
                            zipfile.close()
                        })
                    })
                })
        })
    }
}

export default PercyBinary
