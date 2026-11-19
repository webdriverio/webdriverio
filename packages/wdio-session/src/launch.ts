/**
 * @experimental In-process launch API. The shape may change before it is stable.
 */
export { buildPlan, type PlanContext } from './targets/index.js'
export { launch, type Launched, type LaunchOptions, type SessionResult } from './targets/launch.js'
export type { OpenArgs } from './targets/utils.js'
export type { OpenPlan } from './types.js'
