#!/usr/bin/env node

import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { promisify } from 'node:util'
import { createRequire } from 'node:module'

import mime from 'mime-types'
import readDir from 'recursive-readdir'

import pkg from '../lerna.json' assert { type: 'json' }

const require = createRequire(import.meta.url)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const { S3, CloudFront } = require('aws-sdk')

const PKG_VERSION = pkg.version
const PRODUCTION_VERSION = 'v7'
const DISTRIBUTION_ID = process.env.DISTRIBUTION_ID
const BUCKET_NAME = 'webdriver.io'
const BUILD_DIR = path.resolve(__dirname, '..', 'website', 'build')
const UPLOAD_OPTIONS = { partSize: 10 * 1024 * 1024, queueSize: 1 }
const IGNORE_FILE_SUFFIX = ['*.rb']

/* eslint-disable no-console */
const timestamp = Date.now()
const s3 = new S3()
const files = await readDir(BUILD_DIR, IGNORE_FILE_SUFFIX)

const version = `v${PKG_VERSION.split('.')[0]}`
const bucketName = version === PRODUCTION_VERSION ? BUCKET_NAME : `${version}.${BUCKET_NAME}`

/**
 * upload assets
 */
console.log(`Uploading ${BUILD_DIR} to S3 bucket ${bucketName}`)
await Promise.all(files.map((file) => new Promise((resolve, reject) => s3.upload({
    Bucket: bucketName,
    Key: file.replace(BUILD_DIR + '/', ''),
    Body: fs.createReadStream(file),
    ContentType: mime.lookup(file),
    ACL: 'public-read'
}, UPLOAD_OPTIONS, (err, res) => {
    if (err) {
        console.error(`Couldn't upload file ${file}: ${err.stack}`)
        return reject(err)
    }

    console.log(`${file} uploaded`)
    return resolve(res)
}))))

/**
 * invalidate distribution
 */
const distributionId = version === PRODUCTION_VERSION
    ? DISTRIBUTION_ID
    : process.env[`DISTRIBUTION_ID_${version.toUpperCase()}`]
if (distributionId) {
    console.log(`Invalidate objects from distribution ${distributionId}`)
    const cloudfront = new CloudFront()
    const { Invalidation } = await promisify(cloudfront.createInvalidation.bind(cloudfront))({
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: `${timestamp}`,
            Paths: { Quantity: 1, Items: ['/*'] }
        }
    })
    console.log(`Created new invalidation with ID ${Invalidation.Id}`)
}

/**
 * delete old assets
 */
const objects = await promisify(s3.listObjects.bind(s3))({
    Bucket: bucketName
})
const objectsToDelete = objects.Contents.filter((obj) => (
    (obj.LastModified)).getTime() < timestamp)
console.log(`Found ${objectsToDelete.length} outdated objects to remove...`)

await Promise.all(objectsToDelete.map((obj) => (
    promisify(s3.deleteObject.bind(s3))({
        Bucket: bucketName,
        Key: obj.Key
    })
)))
console.log('Deleted obsolete items successfully')
console.log('Successfully updated webdriver.io docs')
/* eslint-enable no-console */
