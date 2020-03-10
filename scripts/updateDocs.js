#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const shell = require('shelljs')
const mime = require('mime-types')
const readDir = require('recursive-readdir')
const { S3, CloudFront } = require('aws-sdk')

const DISTRIBUTION_ID = process.env.DISTRIBUTION_ID
const BUCKET_NAME = 'webdriver.io'
const BUILD_DIR = path.resolve(__dirname, '..', 'website', 'build', 'webdriver.io')
const UPLOAD_OPTIONS = { partSize: 10 * 1024 * 1024, queueSize: 1 }
const IGNORE_FILE_SUFFIX = ['*.rb']

/* eslint-disable no-console */
;(async () => {
    const s3 = new S3()
    const files = await readDir(BUILD_DIR, IGNORE_FILE_SUFFIX)

    const { stdout } = shell.exec('git rev-parse --abbrev-ref HEAD', { silent: true })
    const currentBranch = stdout.trim()

    if (currentBranch === 'master' || currentBranch.startsWith('v')) {
        return console.log('No documentation update until v6 is released')
    }

    // const bucketName = currentBranch === 'master' ? BUCKET_NAME : `${currentBranch}.${BUCKET_NAME}`
    const bucketName = BUCKET_NAME

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

    const distributionId = currentBranch === 'master'
        ? DISTRIBUTION_ID
        : process.env[`DISTRIBUTION_ID_${currentBranch.toUpperCase()}`]
    console.log(`Invalidate objects from distribution ${distributionId}`)
    const cloudfront = new CloudFront()
    const { Invalidation } = await promisify(cloudfront.createInvalidation)({
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
