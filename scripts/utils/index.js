const githubReadme = '/README.md'
const githubHost = 'https://github.com/'
const githubRawHost = 'https://raw.githubusercontent.com/'

/**
 * Download README.md from github
 * @param {string}              githubUrl   github url to project
 * @param {string}              location    file location in repo
 * @return {Promise<string>}                readme content
 */
export async function downloadFromGitHub(githubUrl, branch, location = githubReadme) {
    const url = `${githubUrl}/${branch}${location}`.replace(githubHost, githubRawHost)
    // eslint-disable-next-line no-console
    console.log(`Downloading: ${url}`)
    const res = await fetch(url)
    return await res.text()
}
