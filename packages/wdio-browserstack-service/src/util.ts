import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import type { Capabilities } from '@wdio/types'
import logger from '@wdio/logger'

import { BROWSER_DESCRIPTION, DATA_ENDPOINT } from './constants'

import got from 'got'
import { hostname, platform, type, version, arch } from 'os'
import { promisify } from 'util'
import { Repository } from 'nodegit'
import gitRepoInfo from 'git-repo-info'
import gitconfig from 'gitconfiglocal'
import { Frameworks } from '@wdio/types'

const pGitconfig = promisify(gitconfig)
const log = logger('@wdio/browserstack-service')

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

export async function launchTestSession (userConfig: any) {
    const BSTestOpsToken = `${userConfig.username}:${userConfig.password}`

    if (BSTestOpsToken === '') {
        log.debug('[Start_Build] Missing BROWSERSTACK_TESTOPS_TOKEN')
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        return [null, null]
    }

    const data = {
        'format': 'json',
        'project_name': userConfig.projectName,
        'name': userConfig.buildName,
        'start_time': (new Date()).toISOString(),
        'tags': [userConfig.buildTag],
        'host_info': {
            hostname: hostname(),
            platform: platform(),
            type: type(),
            version: version(),
            arch: arch()
        },
        'ci_info': getCiInfo(),
        'failed_tests_rerun': process.env.BROWSERSTACK_RERUN || false,
        'version_control': await getGitMetaData()
    }
    const config = {
        username: userConfig.username,
        password: userConfig.password,
        headers: {
            'Content-Type': 'application/json',
            'X-BSTACK-OBS': 'true'
        },
    }

    try {
        let url = `http://${DATA_ENDPOINT}/api/v1/builds`
        let response: any
        try {
            response = await got.post(url, { json: data, ...config }).json()
        } catch (error) {
            log.debug(`[Start_Build] Browserstack TestOps failed. Error: ${error}`)
        }
        log.debug(`[Start_Build] Success response: ${JSON.stringify(response)}`)
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        return [response.jwt, response.build_hashed_id]
    } catch (error: any) {
        log.debug(`[Start_Build] Failed. Error: ${error}`)
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        return [null, null]
    }
}

export async function stopBuildUpstream () {
    if (process.env.BS_TESTOPS_BUILD_COMPLETED) {
        if (!process.env.BS_TESTOPS_JWT) {
            log.debug('[Stop_Build] Missing Authentication Token/ Build ID')
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
            },
        }

        try {
            let url = `http://${DATA_ENDPOINT}/api/v1/builds/${process.env.BS_TESTOPS_BUILD_HASHED_ID}/stop`
            let response: any
            try {
                response = await got.put(url, { json: data, ...config }).json()
            } catch (error) {
                log.debug(`[Stop_Build] Failed. Error: ${error}`)
            }
            log.debug(`[Stop_Build] Success response: ${JSON.stringify(response)}`)
            return {
                status: 'success',
                message: ''
            }
        } catch (error: any) {
            log.debug(`[Stop_Build] Failed. Error: ${error}`)
        }
    }
}

export function getCiInfo () {
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
            build_url: `${env.SYSTEM_TEAMFOUNDATIONSERVERURI}${env.SYSTEM_TEAMPROJECTID}`,
            job_name: env.SYSTEM_DEFINITIONID,
            build_number: env.BUILD_BUILDID
        }
    }
    // if no matches, return null
    return null
}

export async function getGitMetaData () {
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

export function getUniqueIdentifier(test: Frameworks.Test): string {
    // mocha
    return `${test.parent} - ${test.title}`
}

export function getUniqueIdentifierForCucumber(obj: any): string {
    // cucumber
    return obj.pickle.uri + '_' + obj.pickle.astNodeIds.join(',')
}

export function getCloudProvider(browser: any): string {
    let provider: string = 'UNKNOWN'
    if (browser.options && browser.options.hostname) {
        let hostname: string = browser.options.hostname
        if (hostname.includes('browserstack') || hostname.includes('bsstag')) {
            return 'browserstack'
        } else if (hostname.includes('saucelabs')) {
            return 'sauce'
        } else if (hostname.includes('lambdatest')) {
            return 'lambdatest'
        } else if (hostname.includes('testingbot')) {
            return 'testingbot'
        }
    }
    return provider
}

export function isBrowserstackSession(browser: any): boolean {
    return getCloudProvider(browser).toLowerCase() == 'browserstack'
}

export function getLaunchInfo(capabilities: any) {
    let buildName: any
    let projectName: any
    let buildTag: any
    let caps: any

    if (Array.isArray(capabilities)) {
        caps = capabilities[0]['bstack:options']
    } else if (typeof capabilities === 'object') {
        caps = capabilities['bstack:options']
    }

    if (caps) {
        buildName = caps.buildName || caps.build
        projectName = caps.projectName || caps.project
        buildTag = caps.buildTag
    }

    buildName = buildName || process.cwd()

    return [buildName, projectName, buildTag]
}

export function getScenarioNameWithExamples(world: any): string {
    let scenario: any = world.pickle

    // no examples present
    if ((scenario.astNodeIds && scenario.astNodeIds.length <= 1) || scenario.astNodeIds == undefined) return scenario.name

    let pickleId: string = scenario.astNodeIds[0]
    let examplesId: string = scenario.astNodeIds[1]
    let gherkinDocumentChildren = world.gherkinDocument.feature.children

    let examples: string[] = []

    gherkinDocumentChildren.forEach((child: any) => {
        if (child.rule) {
            // handle if rule is present
            child.rule.children.forEach((childLevel2: any) => {
                if (childLevel2.scenario && childLevel2.scenario.id == pickleId && childLevel2.scenario.examples) {
                    examples = childLevel2.scenario.examples.flatMap((val: any) => (val.tableBody)).find((item: any) => item.id == examplesId).cells.map((val: any) => (val.value))
                }
            })
        } else if (child.scenario && child.scenario.id == pickleId && child.scenario.examples) {
            // handle if scenario outside rule
            examples = child.scenario.examples.flatMap((val: any) => (val.tableBody)).find((item: any) => item.id == examplesId).cells.map((val: any) => (val.value))
        }
    })

    if (examples.length) {
        return scenario.name + ' (' + examples.join(', ')  + ')'
    }
    return scenario.name
}

export function removeAnsiColors(message: string): string {
    // https://stackoverflow.com/a/29497680
    // eslint-disable-next-line no-control-regex
    return message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
}

export async function uploadEventData (eventData: any) {
    let logTag: string = ''
    switch (eventData.event_type) {
    case 'TestRunStarted':
    case 'TestRunFinished':
        logTag = 'Test_Upload'
        break
    case 'HookRunStarted':
    case 'HookRunFinished':
        logTag = 'Hook_Upload'
        break
    case 'LogCreated':
        logTag = 'Log_Upload'
        break
    }

    if (process.env.BS_TESTOPS_BUILD_COMPLETED) {
        if (!process.env.BS_TESTOPS_JWT) {
            log.debug(`[${logTag}] Missing Authentication Token/ Build ID`)
            return {
                status: 'error',
                message: 'Token/buildID is undefined, build creation might have failed'
            }
        }
        const config = {
            headers: {
                'Authorization': `Bearer ${process.env.BS_TESTOPS_JWT}`,
                'Content-Type': 'application/json',
                'X-BSTACK-OBS': 'true'
            },
        }

        try {
            let url = `http://${DATA_ENDPOINT}/api/v1/event`
            await got.post(url, { json: eventData, ...config }).json().then(( data: any ) => {
                log.debug(`[${logTag}] Success response: ${require('util').inspect(data, { depth: null })}`)
            }).catch((error: any) => {
                log.debug(`[${logTag}] Failed. Error: ${error}`)
            })
        } catch (error: any) {
            log.debug(`[${logTag}] Failed. Error: ${error}`)
        }
    }
}
