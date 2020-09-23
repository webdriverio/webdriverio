const fs = require('fs-extra')
const path = require('path')
const request = require('request')
const urljoin = require('url-join')

const { buildPreface } = require('../utils/helpers')
const reporters3rdParty = require('./3rd-party/reporters.json')
const services3rdParty = require('./3rd-party/services.json')
const api3rdParty = require('./3rd-party/api.json')

const plugins = [{
    category: 'docs', namePlural: 'Reporter', nameSingular: 'Reporter', packages3rdParty: reporters3rdParty
}, {
    category: 'docs', namePlural: 'Services', nameSingular: 'Service', packages3rdParty: services3rdParty
}, {
    category: 'api', namePlural: 'Testrunner', nameSingular: '', packages3rdParty: api3rdParty
}]
const githubHost = 'https://github.com/'
const githubRawHost = 'https://raw.githubusercontent.com/'
const githubReadme = 'master/README.md'

const readmeHeaderLines = 9
const readmeHeaders = ['===', '# ']
const readmeBadges = ['https://badge', 'https://travis-ci.org/']

const PROJECT_ROOT_DIR = path.join(__dirname, '..', '..')
const DOCS_ROOT_DIR = path.join(PROJECT_ROOT_DIR, 'docs')

/**
 * Generate docs for 3rd party reporters and services
 * @param {object} sidebars website/sidebars
 */
exports.generate3rdPartyDocs = async (sidebars) => {
    for (const { category, namePlural, nameSingular, packages3rdParty } of plugins) {
        const categoryDir = path.join(DOCS_ROOT_DIR, category)
        await fs.ensureDir(categoryDir)

        for (const { packageName, title, githubUrl, npmUrl, suppressBuildInfo, location = githubReadme } of packages3rdParty) {
            const readme = await downloadReadme(githubUrl, location)
            const id = `${packageName}`.replace(/@/g, '').replace(/\//g, '-')

            const doc = normalizeDoc(readme, githubUrl,
                buildPreface(id, title, nameSingular, `${githubUrl}/edit/${location}`),
                suppressBuildInfo ? [] : buildInfo(packageName, githubUrl, npmUrl))
            await fs.writeFile(path.join(categoryDir, `_${id}.md`), doc, { encoding: 'utf-8' })

            if (!sidebars[category][namePlural]) {
                sidebars[category][namePlural] = []
            }

            // eslint-disable-next-line no-console
            console.log(`Generated docs for ${packageName}`)

            sidebars[category][namePlural].push(`${category}/${id}`)
        }
    }
}

/**
 * Download README.md from github
 * @param {string}              githubUrl   github url to project
 * @param {string}              location    file location in repo
 * @return {Promise<string>}                readme content
 */
function downloadReadme(githubUrl, location = githubReadme) {
    return new Promise((resolve, reject) => {
        const url = `${githubUrl}/${location}`.replace(githubHost, githubRawHost)
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
        if (row.match(/^(# )\1* /)) {
            readmeArr[idx] = `#${row}`
        }

        /**
         * transform partial to full links
         * match links like [foo](bar). `stringInParentheses` would be `bar`
         * do not match [foo](http://bar), [foo](#bar)
         */
        const mdLinks = row.match(/\[([^\]]+)\]\(([^)"]+)(?: "([^"]+)")?\)/g) || []
        for (const mdLink of mdLinks) {
            const urlMatcher = mdLink.match(/\[([^[]+)\]\((.*)\)/)
            const stringInParentheses = urlMatcher[2]
            const url = stringInParentheses.startsWith('http')
                ? stringInParentheses
                : urljoin(githubUrl, 'blob', 'master', stringInParentheses)
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
