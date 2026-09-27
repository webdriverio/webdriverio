import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { requirePackage } from '../deps.js'
import { SessionError, usage } from '../errors.js'
import type { OpenPlan } from '../types.js'
import type { OpenArgs } from './utils.js'

export const SAUCE_REGIONS = ['us-west-1', 'eu-central-1', 'apac-southeast-1'] as const
export type SauceRegion = typeof SAUCE_REGIONS[number]

export type CloudProviderId = 'browserstack' | 'saucelabs' | 'testingbot' | 'testmu'

interface Hub {
    protocol: 'https'
    hostname: string
    port: number
    path: string
}

interface UploadSpec {
    url: string
    fileField: string
    fields?: Record<string, string>
    appUrl: (body: Record<string, unknown>, filename: string) => string
}

interface Provider {
    id: CloudProviderId
    label: string
    userEnv: string
    keyEnv: string
    optionsKey: string
    userField: string
    keyField: string
    tunnelPackage: string
    hub: (region: string, mobile: boolean) => Hub
    upload: (region: string, filename: string) => UploadSpec
}

const PROVIDERS: Record<CloudProviderId, Provider> = {
    browserstack: {
        id: 'browserstack',
        label: 'BrowserStack',
        userEnv: 'BROWSERSTACK_USERNAME',
        keyEnv: 'BROWSERSTACK_ACCESS_KEY',
        optionsKey: 'bstack:options',
        userField: 'userName',
        keyField: 'accessKey',
        tunnelPackage: 'browserstack-local',
        hub: () => ({ protocol: 'https', hostname: 'hub.browserstack.com', port: 443, path: '/wd/hub' }),
        upload: () => ({
            url: 'https://api-cloud.browserstack.com/app-automate/upload',
            fileField: 'file',
            appUrl: (body) => String(body.app_url || '')
        })
    },
    saucelabs: {
        id: 'saucelabs',
        label: 'Sauce Labs',
        userEnv: 'SAUCE_USERNAME',
        keyEnv: 'SAUCE_ACCESS_KEY',
        optionsKey: 'sauce:options',
        userField: 'username',
        keyField: 'accessKey',
        tunnelPackage: 'saucectl',
        hub: (region) => ({ protocol: 'https', hostname: `ondemand.${region}.saucelabs.com`, port: 443, path: '/wd/hub' }),
        upload: (region, filename) => ({
            url: `https://api.${region}.saucelabs.com/v1/storage/upload`,
            fileField: 'payload',
            fields: { name: filename },
            appUrl: (body) => {
                const item = body.item as { id?: string } | undefined
                return item?.id ? `storage:${item.id}` : ''
            }
        })
    },
    testingbot: {
        id: 'testingbot',
        label: 'TestingBot',
        userEnv: 'TESTINGBOT_KEY',
        keyEnv: 'TESTINGBOT_SECRET',
        optionsKey: 'tb:options',
        userField: 'key',
        keyField: 'secret',
        tunnelPackage: 'testingbot-tunnel-launcher',
        hub: () => ({ protocol: 'https', hostname: 'hub.testingbot.com', port: 443, path: '/wd/hub' }),
        upload: () => ({
            url: 'https://api.testingbot.com/v1/storage',
            fileField: 'file',
            appUrl: (body) => String(body.app_url || '')
        })
    },
    testmu: {
        id: 'testmu',
        label: 'TestMu AI',
        userEnv: 'LT_USERNAME',
        keyEnv: 'LT_ACCESS_KEY',
        optionsKey: 'LT:Options',
        userField: 'user',
        keyField: 'accessKey',
        tunnelPackage: '@lambdatest/node-tunnel',
        hub: (_region, mobile) => ({
            protocol: 'https',
            hostname: mobile ? 'mobile-hub.lambdatest.com' : 'hub.lambdatest.com',
            port: 443,
            path: '/wd/hub'
        }),
        upload: (_region, filename) => ({
            url: 'https://manual-api.lambdatest.com/app/upload/realDevice',
            fileField: 'appFile',
            fields: { name: filename },
            appUrl: (body) => String(body.app_url || '')
        })
    }
}

function providerOf (value: unknown): Provider {
    const id = String(value || '')
    if (!Object.hasOwn(PROVIDERS, id)) {
        throw usage(`Unknown provider "${id}".`, 'Use browserstack, saucelabs, testingbot or testmu.')
    }
    return PROVIDERS[id as CloudProviderId]
}

function credentials (provider: Provider, env: NodeJS.ProcessEnv) {
    const user = env[provider.userEnv]
    const key = env[provider.keyEnv]
    if (!user || !key) {
        throw new SessionError(
            'MISSING_CREDENTIALS',
            `${provider.label} needs ${provider.userEnv} and ${provider.keyEnv}.`,
            { hint: `Export ${provider.userEnv} and ${provider.keyEnv}, then run the command again.` }
        )
    }
    return { user, key }
}

function regionOf (provider: Provider, args: OpenArgs) {
    const region = typeof args.region === 'string' && args.region ? args.region : 'us-west-1'
    if (provider.id === 'saucelabs' && !SAUCE_REGIONS.includes(region as SauceRegion)) {
        throw usage(`Unknown Sauce Labs region "${region}".`, `Use ${SAUCE_REGIONS.join(', ')}.`)
    }
    return region
}

function isRemoteApp (value: string) {
    return /^(https?:|bs:|tb:|lt:|storage:)/i.test(value)
}

function stripLocalBrowserOptions (caps: Record<string, unknown>) {
    for (const key of ['goog:chromeOptions', 'ms:edgeOptions', 'moz:firefoxOptions'] as const) {
        const options = caps[key] as { args?: string[], binary?: string } | undefined
        if (!options) {
            continue
        }
        const args = (options.args || []).filter((arg) =>
            !arg.startsWith('--headless') &&
            !arg.startsWith('--window-size') &&
            !arg.startsWith('--user-data-dir') &&
            arg !== '--disable-gpu' &&
            arg !== '-headless' &&
            !arg.startsWith('--width') &&
            !arg.startsWith('--height') &&
            arg !== '-profile'
        )
        if (!args.length && !options.binary) {
            delete caps[key]
        } else {
            options.args = args
        }
    }
}

function optionFields (provider: Provider, args: OpenArgs, creds: { user: string, key: string }, tunnelName?: string, useTunnel = false) {
    const options: Record<string, unknown> = {
        [provider.userField]: creds.user,
        [provider.keyField]: creds.key
    }
    const name = typeof args.name === 'string' ? args.name : undefined
    const build = typeof args.build === 'string' ? args.build : undefined
    const project = typeof args.project === 'string' ? args.project : undefined
    if (provider.id === 'browserstack') {
        if (typeof args.os === 'string' && args.os) {
            options.os = args.os
        }
        if (typeof args.osVersion === 'string' && args.osVersion) {
            options.osVersion = args.osVersion
        }
        if (project) {
            options.projectName = project
        }
        if (build) {
            options.buildName = build
        }
        if (name) {
            options.sessionName = name
        }
        if (typeof args.device === 'string' && args.device) {
            options.deviceName = args.device
        }
        if (useTunnel) {
            options.local = true
            if (tunnelName) {
                options.localIdentifier = tunnelName
            }
        }
    } else if (provider.id === 'saucelabs') {
        if (name) {
            options.name = name
        }
        if (build) {
            options.build = build
        }
        if (useTunnel && tunnelName) {
            options.tunnelName = tunnelName
        }
    } else if (provider.id === 'testingbot') {
        if (name) {
            options.name = name
        }
        if (build) {
            options.build = build
        }
        if (useTunnel && tunnelName) {
            options.tunnelIdentifier = tunnelName
        }
    } else {
        options.w3c = true
        if (name) {
            options.name = name
        }
        if (build) {
            options.build = build
        }
        if (project) {
            options.project = project
        }
        if (typeof args.os === 'string' && args.os) {
            options.platformName = args.osVersion ? `${args.os} ${args.osVersion}` : args.os
        }
        if (typeof args.device === 'string' && args.device) {
            options.deviceName = args.device
            options.isRealMobile = true
        }
        if (useTunnel) {
            options.tunnel = true
            if (tunnelName) {
                options.tunnelName = tunnelName
            }
        }
    }
    return options
}

async function uploadApp (spec: UploadSpec, file: string, creds: { user: string, key: string }) {
    const filename = path.basename(file)
    const bytes = fs.readFileSync(file)
    const form = new FormData()
    form.append(spec.fileField, new File([bytes], filename))
    for (const [key, value] of Object.entries(spec.fields || {})) {
        form.append(key, value)
    }
    const response = await fetch(spec.url, {
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from(`${creds.user}:${creds.key}`).toString('base64')}` },
        body: form
    })
    const text = await response.text()
    let body: Record<string, unknown> = {}
    try {
        body = text ? JSON.parse(text) : {}
    } catch {
        body = {}
    }
    if (!response.ok) {
        throw new SessionError('SESSION_START_FAILED', `App upload failed (${response.status}): ${text.slice(0, 300)}`)
    }
    const appUrl = spec.appUrl(body, filename)
    if (!appUrl) {
        throw new SessionError('SESSION_START_FAILED', `App upload did not return an app URL: ${text.slice(0, 300)}`)
    }
    return appUrl
}

/**
 * Point a plan at a cloud provider: hub, credentials, vendor options and,
 * for a local app file, an upload that rewrites `appium:app`.
 */
export async function applyCloudProvider (plan: OpenPlan, args: OpenArgs, env: NodeJS.ProcessEnv): Promise<OpenPlan> {
    const provider = providerOf(args.provider)
    const creds = credentials(provider, env)
    const region = regionOf(provider, args)
    const mobile = plan.platform === 'mobile' || plan.applies.includes('M')
    const caps = { ...(plan.capabilities as Record<string, unknown>) }
    stripLocalBrowserOptions(caps)
    caps['wdio:enforceWebDriverClassic'] = true

    const tunnel = args.tunnel
    const useTunnel = tunnel !== undefined && tunnel !== false && tunnel !== ''
    const tunnelValue = typeof tunnel === 'string' ? tunnel : ''
    const external = tunnelValue === 'external'
    const tunnelName = (typeof args.tunnelName === 'string' && args.tunnelName) || (!external && tunnelValue ? tunnelValue : undefined)
    if (useTunnel && !external && provider.id === 'browserstack') {
        const entry = await requirePackage(provider.tunnelPackage, {
            cwd: plan.cwd,
            feature: `open a ${provider.label} tunnel`,
            from: import.meta.url
        })
        plan.tunnel = { package: provider.tunnelPackage, entry, name: tunnelName }
    } else if (useTunnel && !external) {
        plan.notes.push(`Start the ${provider.tunnelPackage} tunnel${tunnelName ? ` "${tunnelName}"` : ''} before this session, or pass --tunnel external once it is running.`)
    }

    const app = caps['appium:app']
    if (typeof app === 'string' && app && !isRemoteApp(app)) {
        if (!fs.existsSync(app)) {
            throw usage(`App not found: ${app}`)
        }
        const spec = provider.upload(region, path.basename(app))
        caps['appium:app'] = await uploadApp(spec, app, creds)
    }

    caps[provider.optionsKey] = {
        ...(caps[provider.optionsKey] as Record<string, unknown> || {}),
        ...optionFields(provider, args, creds, tunnelName, useTunnel)
    }

    const remote = { ...plan.remote, user: creds.user, key: creds.key }
    if (!plan.remote.hostname) {
        Object.assign(remote, provider.hub(region, mobile))
    }
    return {
        ...plan,
        provider: provider.id,
        label: `${plan.label} (${provider.label})`,
        bidi: false,
        display: false,
        capabilities: caps as OpenPlan['capabilities'],
        remote,
        notes: plan.notes
    }
}

/**
 * Start a BrowserStack Local tunnel. Other providers print a note at plan
 * time and expect the tunnel to be running already.
 */
export async function startCloudTunnel (plan: OpenPlan): Promise<() => Promise<void>> {
    const tunnel = plan.tunnel
    if (!tunnel || tunnel.package !== 'browserstack-local') {
        return async () => {}
    }
    const mod = await import(pathToFileURL(tunnel.entry).href) as { Local?: new () => { start: (opts: Record<string, unknown>, cb: (err?: Error) => void) => void, stop: (cb: () => void) => void } }
    const Local = mod.Local
    if (!Local) {
        throw new SessionError('SESSION_START_FAILED', 'browserstack-local did not export Local.')
    }
    const client = new Local()
    await new Promise<void>((resolve, reject) => {
        client.start({ key: plan.remote.key, localIdentifier: tunnel.name, force: true, onlyAutomate: true }, (err) => err ? reject(err) : resolve())
    })
    return () => new Promise((resolve) => client.stop(() => resolve()))
}
