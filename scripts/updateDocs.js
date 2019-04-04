#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readDir = require('recursive-readdir')
const { S3, CloudFront } = require('aws-sdk')

const DISTRIBUTION_ID = process.env.DISTRIBUTION_ID
const BUCKET_NAME = 'webdriver.io'
const BUILD_DIR = path.resolve(__dirname, '..', 'website', 'build', 'webdriver.io')
const UPLOAD_OPTIONS = { partSize: 10 * 1024 * 1024, queueSize: 1 }

/* eslint-disable no-console */
;(async () => {
    const s3 = new S3()
    const files = await readDir(BUILD_DIR)

    console.log(`Uploading ${BUILD_DIR} to S3 bucket ${BUCKET_NAME}`)
    await Promise.all(files.map((file) => new Promise((resolve, reject) => s3.upload({
        Bucket: BUCKET_NAME,
        Key: file.replace(BUILD_DIR + '/', ''),
        Body: fs.createReadStream(file)
    }, UPLOAD_OPTIONS, (err, res) => {
        if (err) {
            console.error(`Couldn't upload file ${file}: ${err.stack}`)
            return reject(err)
        }

        console.log(`${file} uploaded`)
        return resolve(res)
    }))))

    console.log(`Invalidate objects from distribution ${DISTRIBUTION_ID}`)
    const cloudfront = new CloudFront()
    await new Promise((reject, resolve) => cloudfront.createInvalidation({
        DistributionId: DISTRIBUTION_ID,
        InvalidationBatch: {
            CallerReference: `${Date.now()}`,
            Paths: { Quantity: 1, Items: ['/docs/*'] }
        }
    }, function(err, data) {
        if (err) {
            console.log(err, err.stack)
            return reject(err)
        }

        console.log('invalidated objects')
        return resolve(data)
    }))
})().then(
    () => console.log('Successfully updated webdriver.io docs'),
    (err) => console.error(`Error uploading docs: ${err.stack}`)
)
/* eslint-enable no-console */
