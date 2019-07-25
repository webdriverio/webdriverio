#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const readDir = require('recursive-readdir')
const { S3 } = require('aws-sdk')

const BUCKET_NAME = 'coverage.webdriver.io'
const COVERAGE_DIR = path.resolve(__dirname, '..', 'coverage', 'lcov-report')
const UPLOAD_OPTIONS = { partSize: 10 * 1024 * 1024, queueSize: 1 }
const PR_NUMBER = process.env.TRAVIS_PULL_REQUEST // false if not PR build

/* eslint-disable no-console */
;(async () => {
    if (!PR_NUMBER) {
        console.log('Not a PR build - skipping code coverage upload')
        return Promise.resolve()
    }

    const s3 = new S3()
    const files = await readDir(COVERAGE_DIR)

    console.log(`Uploading ${COVERAGE_DIR} to S3 bucket ${BUCKET_NAME}`)
    await Promise.all(files.map((file) => new Promise((resolve, reject) => s3.upload({
        Bucket: BUCKET_NAME,
        Key: file.replace(COVERAGE_DIR, PR_NUMBER),
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

})().then(
    () => console.log('Uploaded code coverage report'),
    (err) => console.error(`Error uploading code coverage report: ${err.stack}`)
)
/* eslint-enable no-console */
