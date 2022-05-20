const fs = require('fs-extra')
const path = require('node:path')
const urljoin = require('url-join')

const { downloadFromGitHub } = require('../utils')
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

const githubReadme = '/README.md'

const readmeHeaderLines = 9
const readmeHeaders = ['===', '# ']
const readmeBadges = ['https://badge', 'https://travis-ci.org/']

const PROJECT_ROOT_DIR = path.join(__dirname, '..', '..')
const DOCS_ROOT_DIR = path.join(PROJECT_ROOT_DIR, 'website', 'docs')

/**
 * Generate docs for 3rd party reporters and services
 * @param {object} sidebars website/sidebars
 */
exports.generate3rdPartyDocs = async (sidebars) => {
    for (const { category, namePlural, nameSingular, packages3rdParty } of plugins) {
        const categoryDir = path.join(DOCS_ROOT_DIR, category === 'api' ? 'api' : '')
        await fs.ensureDir(categoryDir)

        for (const { packageName, title, githubUrl, npmUrl, suppressBuildInfo, locations, location = githubReadme, branch = 'master' } of packages3rdParty) {
            const readme = locations
                ? await Promise.all(locations.map((l) => downloadFromGitHub(githubUrl, branch, l)))
                    .then((readmes) => readmes.join('\n'))
                : await downloadFromGitHub(githubUrl, branch, location)
            const id = `${packageName}`.replace(/@/g, '').replace(/\//g, '-')

            const doc = normalizeDoc(readme, githubUrl, branch,
                buildPreface(id, title, nameSingular, `${githubUrl}/edit/${branch}/${location}`),
                suppressBuildInfo ? [] : buildInfo(packageName, githubUrl, npmUrl))
            await fs.writeFile(path.join(categoryDir, `_${id}.md`), doc, { encoding: 'utf-8' })

            if (namePlural === 'Testrunner') {
                return
            }

            if (!sidebars[category][namePlural]) {
                sidebars[category][namePlural] = []
            }

            // eslint-disable-next-line no-console
            console.log(`Generated docs for ${packageName}`)

            sidebars[category][namePlural].push(
                category === 'api' ? `${category}/${id}` : id
            )
        }
    }
}

/**
 * Removes header from README.md
 * @param {string}  readme      readme content
 * @param {string}  githubUrl     repo url
 * @param {string}  branch     repo branch
 * @param {string}  preface     docusaurus header
 * @param {string}  repoInfo    repoInfo
 * @return {string}             readme content without header
 */
function normalizeDoc(readme, githubUrl, branch, preface, repoInfo) {
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

            if (!urlMatcher) {
                continue
            }

            const stringInParentheses = urlMatcher[2]
            const url = ( stringInParentheses.startsWith('http') || stringInParentheses.startsWith('#') )
                ? stringInParentheses
                : urljoin(githubUrl, 'blob', branch, stringInParentheses)
            readmeArr[idx] = readmeArr[idx].replace(`](${stringInParentheses})`, `](${url})`)
        }
    })

    return [...preface, ...repoInfo, ...readmeArr]
        .join('\n')
        .replace(/<br>/g, '<br />')
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
