const fs = require('fs')
const path = require('path')
const request = require('request')

const { buildPreface } = require('../utils/helpers')
const reporters3rdParty = require('./3rd-party/reporters.json')
const services3rdParty = require('./3rd-party/services.json')

const plugins = {
    reporter: ['Reporter', 'Reporter', reporters3rdParty],
    service: ['Services', 'Service', services3rdParty]
}
const githubHost = 'https://github.com/'
const githubRawHost = 'https://raw.githubusercontent.com/'
const githubReadme = 'master/README.md'

const readmeHeaderLines = 9
const readmeHeaders = ['===', '# ']
const readmeBadges = ['https://badge', 'https://travis-ci.org/']

/**
 * Generate docs for 3rd party reporters and services
 * @param {object} sidebars website/sidebars
 */
exports.generate3rdPartyDocs = async (sidebars) => {
    for (const [, [namePlural, nameSingular, packages3rdParty]] of Object.entries(plugins)) {
        for (const { packageName, title, githubUrl, npmUrl } of packages3rdParty) {
            const readme = await downloadReadme(githubUrl)
            const id = `${packageName}`.replace(/@/g, '').replace(/\//g, '-')

            const doc = normalizeDoc(readme, githubUrl,
                buildPreface(id, title, nameSingular, `${githubUrl}/edit/${githubReadme}`),
                buildInfo(packageName, githubUrl, npmUrl))
            fs.writeFileSync(path.join(__dirname, '..', '..', 'docs', `_${id}.md`), doc, { encoding: 'utf-8' })

            if (!sidebars.docs[namePlural]) {
                sidebars.docs[namePlural] = []
            }

            // eslint-disable-next-line no-console
            console.log(`Generated docs for ${packageName}`)

            sidebars.docs[namePlural].push(id)
        }
    }
}

/**
 * Download README.md from github
 * @param {string}              githubUrl   github url to project
 * @return {Promise<string>}                readme content
 */
function downloadReadme(githubUrl) {
    return new Promise((resolve, reject) => {
        const url = `${githubUrl}/${githubReadme}`.replace(githubHost, githubRawHost)
        // eslint-disable-next-line no-console
        console.log(`Downloading: ${url}`)
        request.get(url, (err, httpResponse, body) => {
            if (err || httpResponse.statusCode !== 200 || !body) {
                return reject({
                    err,
                    statusCode: httpResponse.statusCode,
                    body
                })
            }
            resolve(body)
        })
    })
}

/**
 * Removes header from README.md
 * @param {string}  readme      readme content
 * @param {string}  preface     docusaurus header
 * @param {string}  repoInfo    repoInfo
 * @return {string}             readme content without header
 */
function normalizeDoc(readme, githubUrl, preface, repoInfo) {
    /**
     * remove badges
     */
    let readmeArr = readme.split('\n').filter(row => !readmeBadges.some(b => row.includes(b)))

    /**
     * get index of header to remove further
     */
    let sliceIdx = 0
    for (let i = 0; i < readmeHeaderLines && sliceIdx === 0; i++) {
        if (readmeHeaders.some(x => readmeArr[i].startsWith(x))) {
            sliceIdx = i + 1
        }
    }
    readmeArr = readmeArr.slice(sliceIdx)

    /**
     * prepend additional # to header rows
     * and add path to links
     */
    readmeArr.forEach((row, idx) => {
        /**
         * prepend # to header rows
         */
        if (row.match(/^(#)\1* /)) {
            readmeArr[idx] = `#${row}`
        }

        /**
         * transform partial to full links
         * match links like [foo](bar). `stringInParentheses` would be `bar`
         * do not match [foo](http://bar), [foo](#bar)
         */
        const urlMatcher = row.match(/\[.*\]\(((?!(#|http)).*)\)/)
        if (urlMatcher && urlMatcher.length > 1) {
            const stringInParentheses = urlMatcher[1]
            const url = `${githubUrl}/master/${stringInParentheses}`.replace(githubHost, githubRawHost)
            readmeArr[idx] = readmeArr[idx].replace(`](${stringInParentheses})`, `](${url})`)
        }
    })

    return [...preface, ...repoInfo, ...readmeArr].join('\n')
}

/**
 * 3rd party package info
 * @param {string} packageName package name
 * @param {string} githubUrl GitHub url
 * @param {string} npmUrl npm url
 */
function buildInfo(packageName, githubUrl, npmUrl) {
    return [
        `> ${packageName} is a 3rd party package, for more information please see [GitHub](${githubUrl}) | [npm](${npmUrl})`
    ]
}
