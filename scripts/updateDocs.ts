#!/usr/bin/env node

import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import { CloudFront } from '@aws-sdk/client-cloudfront'
import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import mime from 'mime-types'
import readDir from 'recursive-readdir'

import pkg from '../lerna.json' assert { type: 'json' }

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const region = 'eu-west-1'
const PKG_VERSION = pkg.version
const PRODUCTION_VERSION = 'v8'
const DISTRIBUTION_ID = process.env.DISTRIBUTION_ID
const BUCKET_NAME = 'webdriver.io'
const BUILD_DIR = path.resolve(__dirname, '..', 'website', 'build')
const UPLOAD_OPTIONS = { partSize: 10 * 1024 * 1024, queueSize: 1 }
const IGNORE_FILE_SUFFIX = ['*.rb']

/* eslint-disable no-console */
const timestamp = Date.now()
const s3 = new S3({ region })
const files = await readDir(BUILD_DIR, IGNORE_FILE_SUFFIX)

const version = `v${PKG_VERSION.split('.')[0]}`
const bucketName = version === PRODUCTION_VERSION ? BUCKET_NAME : `${version}.${BUCKET_NAME}`

/**
 * upload assets
 */
console.log(`Uploading ${BUILD_DIR} to S3 bucket ${bucketName}`)
await Promise.all(files.map(async (file) => {
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

/**
 * invalidate distribution
 */
const distributionId = version === PRODUCTION_VERSION
    ? DISTRIBUTION_ID
    : process.env[`DISTRIBUTION_ID_${version.toUpperCase()}`]
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
/* eslint-enable no-console */
