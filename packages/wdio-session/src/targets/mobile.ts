import { checkAppium, type AppiumTarget } from '../deps.js'
import { notSupported } from '../errors.js'
import type { OpenArgs } from './utils.js'
import type { PlanContext } from './index.js'
import type { TargetPlan } from '../types.js'

const REQUIRED_PLATFORM: Partial<Record<AppiumTarget, { platform: NodeJS.Platform, label: string }>> = {
    macos: { platform: 'darwin', label: 'macOS' },
    windows: { platform: 'win32', label: 'Windows' }
}

export async function appiumTargetPlan (target: AppiumTarget, args: OpenArgs, ctx: PlanContext & { env: NodeJS.ProcessEnv }): Promise<TargetPlan> {
    const required = REQUIRED_PLATFORM[target]
    const platform = ctx.platform || process.platform
    if (required && platform !== required.platform && !args.provider && !args.appiumUrl) {
        throw notSupported(`"${target}" sessions require ${required.label}.`)
    }
    if (!args.provider && !args.appiumUrl) {
        await checkAppium(target, { cwd: ctx.cwd, env: ctx.env })
    }
    throw notSupported(`"${target}" sessions are not implemented yet.`)
}
