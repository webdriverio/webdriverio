import fs from 'node:fs'
import path from 'node:path'

import { CloudFront } from '@aws-sdk/client-cloudfront'
import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import mime from 'mime-types'
import readDir from 'recursive-readdir'
import { getRootDir } from '@wdio/repo-utils'

export const PRODUCTION_VERSION = 'v9'
export const DEFAULT_BUCKET_NAME = 'webdriver.io'
export const DEFAULT_REGION = 'eu-west-1'
export const UPLOAD_OPTIONS = { partSize: 10 * 1024 * 1024, queueSize: 1 }
export const IGNORE_FILE_SUFFIX = ['*.rb']

/**
 * Split array in series
 * @param list array to split
 * @param size size of each chunk
 * @returns array of chunks
 */
export function splitInSeries<T>(list: T[], size: number): T[][] {
    const result: T[][] = []

    for (let i = 0; i < list.length; i += size) {
        result.push(list.slice(i, i + size))
    }

    return result
}

export function getDocsVersion(pkgVersion: string) {
    return `v${pkgVersion.split('.')[0]}`
}

export function getBucketName(pkgVersion: string, productionVersion = PRODUCTION_VERSION, bucketName = DEFAULT_BUCKET_NAME) {
    const version = getDocsVersion(pkgVersion)
    return version === productionVersion ? bucketName : `${version}.${bucketName}`
}

export function getDistributionId(
    pkgVersion: string,
    env: NodeJS.ProcessEnv = process.env,
    productionVersion = PRODUCTION_VERSION
) {
    const version = getDocsVersion(pkgVersion)
    return version === productionVersion
        ? env.DISTRIBUTION_ID
        : env[`DISTRIBUTION_ID_${version.toUpperCase()}`]
}

export interface DeployDocsOptions {
    rootDir?: string
    pkgVersion?: string
    buildDir?: string
    region?: string
}

export async function deployDocs (options: DeployDocsOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const pkg = options.pkgVersion
        ? { version: options.pkgVersion }
        : (await import(new URL(`file://${path.join(rootDir, 'lerna.json')}`).href, { with: { type: 'json' } })).default
    const region = options.region ?? DEFAULT_REGION
    const PKG_VERSION = pkg.version
    const BUILD_DIR = options.buildDir ?? path.resolve(rootDir, 'website', 'build')

    const timestamp = Date.now()
    const s3 = new S3({ region })
    const files: string[] = await readDir(BUILD_DIR, IGNORE_FILE_SUFFIX)
    const bucketName = getBucketName(PKG_VERSION)

    /**
     * upload assets
     */
    console.log(`Uploading ${BUILD_DIR} to S3 bucket ${bucketName}`)
    for (const filesBatch of splitInSeries(files, 10)) {
        await Promise.all(filesBatch.map(async (file) => {
            try {
                const mimeType = mime.lookup(file)
                if (!mimeType) {
                    throw new Error(`Couldn't find mime type for ${file}`)
                }

                const res = await new Upload({
                    client: s3,
                    params: {
                        Bucket: bucketName,
                        Key: file.replace(BUILD_DIR + '/', ''),
                        Body: fs.createReadStream(file),
                        ContentType: mimeType,
                        ACL: 'public-read',
                    },
                    ...UPLOAD_OPTIONS
                }).done()
                console.log(`${file} uploaded`)
                return res
            } catch (err) {
                console.error(`Couldn't upload file ${file}: ${(err as Error).stack}`)
                throw err
            }
        }))
    }

    /**
     * invalidate distribution
     */
    const distributionId = getDistributionId(PKG_VERSION)
    if (distributionId) {
        console.log(`Invalidate objects from distribution ${distributionId}`)
        const cloudfront = new CloudFront({ region })
        const { Invalidation } = await cloudfront.createInvalidation({
            DistributionId: distributionId,
            InvalidationBatch: {
                CallerReference: `${timestamp}`,
                Paths: { Quantity: 1, Items: ['/*'] }
            }
        })
        console.log(`Created new invalidation with ID ${Invalidation?.Id}`)
    }

    /**
     * delete old assets
     */
    const objects = await s3.listObjects({
        Bucket: bucketName
    })
    if (!objects.Contents) {
        throw new Error('Couldn\'t find any objects')
    }
    const objectsToDelete = objects.Contents.filter((obj) => obj.LastModified && obj.LastModified.getTime() < timestamp)
    console.log(`Found ${objectsToDelete.length} outdated objects to remove...`)

    await Promise.all(objectsToDelete.map((obj) => (
        s3.deleteObject({
            Bucket: bucketName,
            Key: obj.Key
        })
    )))
    console.log('Deleted obsolete items successfully')
    console.log('Successfully updated webdriver.io docs')
}
