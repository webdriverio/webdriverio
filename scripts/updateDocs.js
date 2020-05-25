#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const mime = require('mime-types')
const readDir = require('recursive-readdir')
const { S3, CloudFront } = require('aws-sdk')

const { version: PKG_VERSION } = require('../lerna.json')

const PRODUCTION_VERSION = 'v6'
const DISTRIBUTION_ID = process.env.DISTRIBUTION_ID
const BUCKET_NAME = 'webdriver.io'
const BUILD_DIR = path.resolve(__dirname, '..', 'website', 'build', 'webdriver.io')
const UPLOAD_OPTIONS = { partSize: 10 * 1024 * 1024, queueSize: 1 }
const IGNORE_FILE_SUFFIX = ['*.rb']

/* eslint-disable no-console */
;(async () => {
    const s3 = new S3()
    const files = await readDir(BUILD_DIR, IGNORE_FILE_SUFFIX)

    const version = `v${PKG_VERSION.split('.')[0]}`
    const bucketName = version === PRODUCTION_VERSION ? BUCKET_NAME : `${version}.${BUCKET_NAME}`

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

    const distributionId = version === PRODUCTION_VERSION
        ? DISTRIBUTION_ID
        : process.env[`DISTRIBUTION_ID_${version.toUpperCase()}`]
    console.log(`Invalidate objects from distribution ${distributionId}`)
    const cloudfront = new CloudFront()
    const { Invalidation } = await promisify(cloudfront.createInvalidation.bind(cloudfront))({
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: `${Date.now()}`,
            Paths: { Quantity: 1, Items: ['/*'] }
        }
    })
    console.log(`Created new invalidation with ID ${Invalidation.Id}`)
})().then(
    () => console.log('Successfully updated webdriver.io docs'),
    (err) => console.error(`Error uploading docs: ${err.stack}`)
)
/* eslint-enable no-console */
