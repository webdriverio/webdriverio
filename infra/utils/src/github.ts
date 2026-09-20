const githubReadme = '/README.md'
const githubHost = 'https://github.com/'
const githubRawHost = 'https://raw.githubusercontent.com/'

/**
 * Download a file from GitHub (defaults to README.md)
 * @param {string}              githubUrl   github url to project
 * @param {string}              location    file location in repo
 * @return {Promise<string>}                file content
 */
export async function downloadFromGitHub(githubUrl: string, branch: string, location = githubReadme) {
    const url = `${githubUrl}/${branch}/${location}`.replace(githubHost, githubRawHost)
    console.log(`Downloading: ${url}`)
    const res = await fetch(url)
    return await res.text()
}
