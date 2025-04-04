import yauzl from 'yauzl'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'

import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { PercyLogger } from './PercyLogger.js'
import PerformanceTester from '../instrumentation/performance/performance-tester.js'
import * as PERFORMANCE_SDK_EVENTS from '../instrumentation/performance/constants.js'
import { BStackLogger } from '../bstackLogger.js'

class PercyBinary {
    #hostOS = process.platform
    #httpPath: string | null = null
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
        } catch {
            return false
        }
    }

    // Get the path for storing the ETag
    #getETagPath(destParentDir: string) {
        return path.join(destParentDir, `${this.#binaryName}.etag`)
    }

    // Load the stored ETag if it exists
    async #loadETag(destParentDir: string) {
        const etagPath = this.#getETagPath(destParentDir)
        if (await this.#checkPath(etagPath)) {
            try {
                const data = await fsp.readFile(etagPath, 'utf8')
                return data.trim()
            } catch (err) {
                BStackLogger.warn(`Failed to read ETag file ${err}`)
            }
        }
        return null
    }

    // Save the ETag for future use
    async #saveETag(destParentDir: string, etag: string) {
        if (!etag) {return}
        try {
            const etagPath = this.#getETagPath(destParentDir)
            await fsp.writeFile(etagPath, etag)
            BStackLogger.debug('Saved new ETag for percy binary')
        } catch (err) {
            BStackLogger.error(`Failed to save ETag file ${err}`)
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

    async getBinaryPath(): Promise<string> {
        const destParentDir = await this.#getAvailableDirs()
        const binaryPath = path.join(destParentDir, this.#binaryName)
        let response
        if (await this.#checkPath(binaryPath)) {
            const currentETag = await this.#loadETag(destParentDir)
            if (currentETag) {
                try {
                    const result = await this.#checkForUpdate(currentETag)
                    if (!result.needsUpdate) {
                        BStackLogger.debug('Percy binary is up to date (ETag unchanged)')
                        return binaryPath
                    }
                    response = result.response
                    BStackLogger.debug('New Percy binary version available, downloading update')
                } catch (err) {
                    BStackLogger.warn(`Failed to check for binary updates, using existing binary ${err}`)
                    return binaryPath
                }
            }
        }

        const downloadedBinaryPath: string = await this.download(destParentDir, response)
        const isValid = await this.validateBinary(downloadedBinaryPath)
        if (!isValid) {
            PercyLogger.error('Corrupt percy binary, retrying')
            return await this.download(destParentDir, response)
        }
        return downloadedBinaryPath
    }

    async #checkForUpdate(currentETag: string): Promise<{ needsUpdate: boolean; response?: Response }> {
        try {
            const headers: HeadersInit = {
                'If-None-Match': currentETag
            }

            const fetchOptions: RequestInit = {
                method: 'GET',
                headers
            }

            const response = await fetch(this.#httpPath as unknown as URL, fetchOptions)

            // If status is 304 Not Modified, binary is up-to-date
            if (response.status === 304) {
                return { needsUpdate: false } // No update needed
            }

            // Save the new ETag if available
            const newETag = response.headers.get('eTag')
            if (newETag) {
                await this.#saveETag(path.dirname(this.#getETagPath(await this.#getAvailableDirs())), newETag)
            }

            return { needsUpdate: true, response }
        } catch (error) {
            BStackLogger.warn(`Error checking for Percy binary updates: ${error}`)
            throw error
        }
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

    @PerformanceTester.Measure(PERFORMANCE_SDK_EVENTS.PERCY_EVENTS.DOWNLOAD)
    async download(destParentDir: string, response?: Response): Promise<string> {
        if (!await this.#checkPath(destParentDir)){
            await fsp.mkdir(destParentDir)
        }
        const binaryName = this.#binaryName
        const zipFilePath = path.join(destParentDir, binaryName + '.zip')
        const binaryPath = path.join(destParentDir, binaryName)
        const downloadedFileStream = fs.createWriteStream(zipFilePath)

        if (!response) {
            response = await fetch(this.#httpPath as unknown as URL)
        }
        const newETag = response.headers.get('eTag')
        if (newETag) {
            await this.#saveETag(destParentDir, newETag)
        }
        // @ts-expect-error stream type
        await pipeline(response.body as unknown as RequestInit, downloadedFileStream)

        return new Promise((resolve, reject) => {
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
                    fs.chmod(binaryPath, '0755', function (zipErr: Error) {
                        if (zipErr) {
                            reject(zipErr)
                        }
                        resolve(binaryPath)
                    })
                    zipfile.close()
                })
            })
        })
    }
}

export default PercyBinary
