import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import type { Capabilities } from '@wdio/types'

import { BROWSER_DESCRIPTION } from './constants'

import { hostname, platform, type, version, arch } from 'os'
import { Agent } from 'http'
import request from 'request'
import { promisify } from 'util'
import { Repository } from 'nodegit'
import gitRepoInfo from 'git-repo-info'
import gitconfig from 'gitconfiglocal'
import { Frameworks } from '@wdio/types'
import { Options } from '@wdio/types'

const pGitconfig = promisify(gitconfig)

/**
 * get browser description for Browserstack service
 * @param cap browser capablities
 */
export function getBrowserDescription(cap: Capabilities.DesiredCapabilities) {
    cap = cap || {}
    if (cap['bstack:options']) {
        cap = { ...cap, ...cap['bstack:options'] } as Capabilities.DesiredCapabilities
    }

    /**
     * These keys describe the browser the test was run on
     */
    return BROWSER_DESCRIPTION
        .map((k: keyof Capabilities.DesiredCapabilities) => cap[k])
        .filter(Boolean)
        .join(' ')
}

/**
 * get correct browser capabilities object in both multiremote and normal setups
 * @param browser browser object
 * @param caps browser capbilities object. In case of multiremote, the object itself should have a property named 'capabilities'
 * @param browserName browser name in case of multiremote
 */
export function getBrowserCapabilities(browser: Browser<'async'> | MultiRemoteBrowser<'async'>, caps?: Capabilities.RemoteCapability, browserName?: string) {
    if (!browser.isMultiremote) {
        return { ...browser.capabilities, ...caps }
    }

    const multiCaps = caps as Capabilities.MultiRemoteCapabilities
    const globalCap = browserName && browser[browserName] ? browser[browserName].capabilities : {}
    const cap = browserName && multiCaps[browserName] ? multiCaps[browserName].capabilities : {}
    return { ...globalCap, ...cap } as Capabilities.Capabilities
}

/**
 * check for browserstack W3C capabilities. Does not support legacy capabilities
 * @param cap browser capabilities
 */
export function isBrowserstackCapability(cap?: Capabilities.Capabilities) {
    return Boolean(
        cap &&
            cap['bstack:options'] &&
            // return false if the only cap in bstack:options is wdioService,
            // as that is added by the service and not present in user passed caps
            !(
                Object.keys(cap['bstack:options']).length === 1 &&
                cap['bstack:options'].wdioService
            )
    )
}

export function getParentSuiteName(fullTitle: string, testSuiteTitle: string): string {
    const fullTitleWords = fullTitle.split(' ')
    const testSuiteTitleWords = testSuiteTitle.split(' ')
    const shortestLength = Math.min(fullTitleWords.length, testSuiteTitleWords.length)
    let c = 0
    let parentSuiteName = ''
    while (c < shortestLength && fullTitleWords[c] === testSuiteTitleWords[c]) {
        parentSuiteName += fullTitleWords[c++] + ' '
    }
    return parentSuiteName.trim()
}

export async function uploadEventData (eventData: any, run=0) {
    const logTag = 'TestRunStarted'
    // logTag = {
    //     ['TestRunStarted']: 'Test_Upload',
    //     ['TestRunFinished']: 'Test_Upload',
    //     ['LogCreated']: 'Log_Upload',
    //     ['HookRunStarted']: 'Hook_Upload',
    //     ['HookRunFinished']: 'Hook_Upload',
    // }[eventData.eventType]

    // if (run === 0) pendingTestUploads += 1

    if (process.env.BS_TESTOPS_BUILD_COMPLETED) {
        if (!process.env.BS_TESTOPS_JWT) {
            console.log(`[${logTag}] Missing Authentication Token/ Build ID`)
            // pendingTestUploads = Math.max(0, pendingTestUploads-1);
            return {
                status: 'error',
                message: 'Token/buildID is undefined, build creation might have failed'
            }
        }
        const data = eventData
        const config = {
            headers: {
                'Authorization': `Bearer ${process.env.BS_TESTOPS_JWT}`,
                'Content-Type': 'application/json',
                'X-BSTACK-OBS': 'true'
            }
        }

        try {
            const response: any = await nodeRequest('POST', 'api/v1/event', data, config)
            if (response.data.error) {
                throw ({ message: response.data.error })
            } else {
                console.log(`[${logTag}] run[${run}] Browserstack TestOps success response: ${JSON.stringify(response.data)}`)
                // pendingTestUploads = Math.max(0,pendingTestUploads-1)
                return {
                    status: 'success',
                    message: ''
                }
            }
        } catch (error: any) {
            if (error.response) {
                console.log(`[${logTag}] Browserstack TestOps error response: ${error.response.status} ${error.response.statusText} ${JSON.stringify(error.response.data)}`)
            } else {
                console.log(`[${logTag}] Browserstack TestOps error: ${error.message || error}`)
            }
            // pendingTestUploads = Math.max(0, pendingTestUploads - 1)
            return {
                status: 'error',
                message: error.message || (error.response ? `${error.response.status}:${error.response.statusText}` : error)
            }
        }
    } else if (run >= 5) {
        console.log(`[${logTag}] BuildStart is not completed and ${logTag} retry runs exceeded`)
        // pendingTestUploads = Math.max(0, pendingTestUploads - 1)
        return {
            status: 'error',
            message: 'Retry runs exceeded'
        }
    } else {
        setTimeout(function(){ exports.uploadEventData(eventData, run+1) }, 1000)
    }
}

export async function launchTestSession (userConfig: any) {
    const BSTestOpsToken = `${userConfig.username}:${userConfig.password}`

    if (BSTestOpsToken === '') {
        // TODO: never go inside this

        // debug('[Start_Build] Missing BROWSERSTACK_TESTOPS_TOKEN')
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        return [null, null]
    }

    const data = {
        'format': 'json',
        'project_name': userConfig.projectName || '',
        'name': userConfig.buildName || process.cwd(), // why process.cwd()?
        'description': userConfig.buildDescription || '', // why buildDescription?
        'start_time': (new Date()).toISOString(),
        // 'tags': this.getCustomTags(userConfig), // get tags
        'host_info': {
            hostname: hostname(),
            platform: platform(),
            type: type(),
            version: version(),
            arch: arch()
        },
        'ci_info': getCiInfo(),
        'failed_tests_rerun': process.env.BROWSERSTACK_TESTOPS_RERUN || false,
        'version_control': await getGitMetaData()
    }
    const config = {
        auth: {
            username: userConfig.username,
            password: userConfig.password
        },
        headers: {
            'Content-Type': 'application/json',
            'X-BSTACK-OBS': 'true'
        }
    }

    try {
        const response: any = await nodeRequest('POST', 'api/v1/builds', data, config)
        console.log(`[Start_Build] Browserstack TestOps success response: ${JSON.stringify(response.data)}`)
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        return [response.data.jwt, response.data.build_hashed_id]
    } catch (error: any) {
        console.log(error)
        if (error.response) {
            console.log(`[Start_Build] Browserstack TestOps error response: ${error.response.status} ${error.response.statusText} ${JSON.stringify(error.response.data)}`)
        } else {
            console.log(`[Start_Build] Browserstack TestOps error: ${error.message || error}`)
        }
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        return [null, null]
    }
}

export async function stopBuildUpstream (buildStartWaitRun: number = 0, testUploadWaitRun: number = 0, forceStop: boolean = false) {
    // if (!forceStop && pending_test_uploads && testUploadWaitRun < 5) {
    //     console.log(`[Stop_Build] Retry ${testUploadWaitRun+1} stopBuildUpstream due to pending event uploads ${pending_test_uploads}`)
    //     setTimeout(function(){ exports.stopBuildUpstream(buildStartWaitRun, testUploadWaitRun+1, false) }, 5000)
    // }

    if (process.env.BS_TESTOPS_BUILD_COMPLETED) {
        if (!process.env.BS_TESTOPS_JWT) {
            console.log('[Stop_Build] Missing Authentication Token/ Build ID')
            return {
                status: 'error',
                message: 'Token/buildID is undefined, build creation might have failed'
            }
        }
        const data = {
            'stop_time': (new Date()).toISOString()
        }
        const config = {
            headers: {
                'Authorization': `Bearer ${process.env.BS_TESTOPS_JWT}`,
                'Content-Type': 'application/json',
                'X-BSTACK-OBS': 'true'
            }
        }

        try {
            const response: any = await nodeRequest('PUT', `api/v1/builds/${process.env.BS_TESTOPS_BUILD_HASHED_ID}/stop`, data, config)
            if (response.data.error) {
                throw ({ message: response.data.error })
            } else {
                console.log(`[Stop_Build] buildStartWaitRun[${buildStartWaitRun}] testUploadWaitRun[${testUploadWaitRun}] Browserstack TestOps success response: ${JSON.stringify(response.data)}`)
                return {
                    status: 'success',
                    message: ''
                }
            }
        } catch (error: any) {
            if (error.response) {
                console.log(`[Stop_Build] Browserstack TestOps error response: ${error.response.status} ${error.response.statusText} ${JSON.stringify(error.response.data)}`)
            } else {
                console.log(`[Stop_Build] Browserstack TestOps error: ${error.message || error}`)
            }
            return {
                status: 'error',
                message: error.message || error.response ? `${error.response.status}:${error.response.statusText}` : error
            }
        }
    } else {
        /* forceStop = true since we won't wait for pendingUploads trigerred post stop flow */
        setTimeout(function(){ exports.stopBuildUpstream(buildStartWaitRun+1, testUploadWaitRun, true) }, 1000)
    }
}

const getCiInfo = () => {
    var env = process.env
    // Jenkins
    if ((typeof env.JENKINS_URL === 'string' && env.JENKINS_URL.length > 0) || (typeof env.JENKINS_HOME === 'string' && env.JENKINS_HOME.length > 0)) {
        return {
            name: 'Jenkins',
            build_url: env.BUILD_URL,
            job_name: env.JOB_NAME,
            build_number: env.BUILD_NUMBER
        }
    }
    // CircleCI
    if (env.CI === 'true' && env.CIRCLECI === 'true') {
        return {
            name: 'CircleCI',
            build_url: env.CIRCLE_BUILD_URL,
            job_name: env.CIRCLE_JOB,
            build_number: env.CIRCLE_BUILD_NUM
        }
    }
    // Travis CI
    if (env.CI === 'true' && env.TRAVIS === 'true') {
        return {
            name: 'Travis CI',
            build_url: env.TRAVIS_BUILD_WEB_URL,
            job_name: env.TRAVIS_JOB_NAME,
            build_number: env.TRAVIS_BUILD_NUMBER
        }
    }
    // Codeship
    if (env.CI === 'true' && env.CI_NAME === 'codeship') {
        return {
            name: 'Codeship',
            build_url: null,
            job_name: null,
            build_number: null
        }
    }
    // Bitbucket
    if (env.BITBUCKET_BRANCH && env.BITBUCKET_COMMIT) {
        return {
            name: 'Bitbucket',
            build_url: env.BITBUCKET_GIT_HTTP_ORIGIN,
            job_name: null,
            build_number: env.BITBUCKET_BUILD_NUMBER
        }
    }
    // Drone
    if (env.CI === 'true' && env.DRONE === 'true') {
        return {
            name: 'Drone',
            build_url: env.DRONE_BUILD_LINK,
            job_name: null,
            build_number: env.DRONE_BUILD_NUMBER
        }
    }
    // Semaphore
    if (env.CI === 'true' && env.SEMAPHORE === 'true') {
        return {
            name: 'Semaphore',
            build_url: env.SEMAPHORE_ORGANIZATION_URL,
            job_name: env.SEMAPHORE_JOB_NAME,
            build_number: env.SEMAPHORE_JOB_ID
        }
    }
    // GitLab
    if (env.CI === 'true' && env.GITLAB_CI === 'true') {
        return {
            name: 'GitLab',
            build_url: env.CI_JOB_URL,
            job_name: env.CI_JOB_NAME,
            build_number: env.CI_JOB_ID
        }
    }
    // Buildkite
    if (env.CI === 'true' && env.BUILDKITE === 'true') {
        return {
            name: 'Buildkite',
            build_url: env.BUILDKITE_BUILD_URL,
            job_name: env.BUILDKITE_LABEL || env.BUILDKITE_PIPELINE_NAME,
            build_number: env.BUILDKITE_BUILD_NUMBER
        }
    }
    // Visual Studio Team Services
    if (env.TF_BUILD === 'True') {
        return {
            name: 'Visual Studio Team Services',
            build_url: null,
            job_name: null,
            build_number: null
        }
    }
    // if no matches, return null
    return null
}

const getGitMetaData = async () => {
    var info: any = gitRepoInfo()
    if (!info.commonGitDir) return {}
    if (!info.author) {
        /* commit objects are packed */
        const headCommit: any = await Repository.open(info.worktreeGitDir.replace('/.git', '')).then(function(repo: any) {
            return repo.getHeadCommit()
        })
        var author = headCommit.author(), committer = headCommit.committer()
        info['author'] = info['author'] || `${author.name()} <${author.email()}>`
        info['authorDate'] = info['authorDate'] || '' // TODO
        info['committer'] = info['committer'] || `${committer.name()} <${committer.email()}>`
        info['committerDate'] = info['committerDate'] || headCommit.date()
        info['commitMessage'] = info['commitMessage'] || headCommit.message()
    }
    const { remote } = await pGitconfig(info.commonGitDir)
    const remotes = Object.keys(remote).map(remoteName =>  ({ name: remoteName, url: remote[remoteName]['url'] }))
    return {
        'name': 'git',
        'sha': info['sha'],
        'short_sha': info['abbreviatedSha'],
        'branch': info['branch'],
        'tag': info['tag'],
        'committer': info['committer'],
        'committer_date': info['committerDate'],
        'author': info['author'],
        'author_date': info['authorDate'],
        'commit_message': info['commitMessage'],
        'root': info['root'],
        'common_git_dir': info['commonGitDir'],
        'worktree_git_dir': info['worktreeGitDir'],
        'last_tag': info['lastTag'],
        'commits_since_last_tag': info['commitsSinceLastTag'],
        'remotes': remotes
    }
}

const httpKeepAliveAgent = new Agent({
    keepAlive: true,
    timeout: 60000
})

async function nodeRequest (type: string, url: string, data: any, config: any) {
    console.log(`http://${process.env.LOCAL_API_HOST}/${url}`) // remove later
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        const options = { ...config, ...{
            method: type,
            url: `http://${process.env.LOCAL_API_HOST}/${url}`,
            body: data,
            json: config.headers['Content-Type'] === 'application/json',
            agent: httpKeepAliveAgent
        } }

        request(options, function callback(error: any, response: any, body: any) {
            if (error) {
                reject(error)
            } else if (response.statusCode != 200) {
                reject(`Received response from BrowserStack TestOps Server with status : ${response.statusCode}`)
            } else {
                try {
                    if (typeof(body) !== 'object') body = JSON.parse(body)
                } catch (e) {
                    reject('Not a JSON response from BrowserStack TestOps Server')
                }
                resolve({
                    data: body
                })
            }
        })
    })
}

export function getUniqueIdentifier(test: Frameworks.Test): string {
    if (test.fullName) {
        // jasmine
        return test.fullName
    }
    // mocha and cucumber
    return `${test.parent} - ${test.title}`
}

export function getCloudProvider(config: Options.Testrunner): string {
    let provider: string = 'UNKNOWN'
    if (config.services) {
        for (let i = 0; i < config.services.length;  i += 1) {
            let service: any = config.services[i]
            if (Array.isArray(service)) {
                let serviceName: string = service[0]
                if (serviceName == 'sauce' || serviceName == 'browserstack') {
                    provider = serviceName
                    break
                }
            }
        }
    }
    return provider
}
