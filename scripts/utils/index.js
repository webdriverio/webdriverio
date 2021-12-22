const request = require('request')

const githubReadme = '/README.md'
const githubHost = 'https://github.com/'
const githubRawHost = 'https://raw.githubusercontent.com/'

/**
 * Download README.md from github
 * @param {string}              githubUrl   github url to project
 * @param {string}              location    file location in repo
 * @return {Promise<string>}                readme content
 */
function downloadFromGitHub(githubUrl, branch, location = githubReadme) {
    return new Promise((resolve, reject) => {
        const url = `${githubUrl}/${branch}${location}`.replace(githubHost, githubRawHost)
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

module.exports = {
    downloadFromGitHub
}
