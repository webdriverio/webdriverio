export type LaneName = 'ci' | 'docs' | 'component' | 'xvfb' | 'code'

export type LaneFilters = Record<LaneName, readonly string[]>

export interface GlobMatch {
    readonly matched: boolean
    readonly negated: boolean
}

export interface LaneFlags {
    ci: boolean
    docs: boolean
    component: boolean
    xvfb: boolean
    code: boolean
}

export interface ChangeReport {
    base: string
    files: string[]
    lanes: LaneFlags
    runAll: boolean
    packages: string[]
    typings: string[]
    smoke: boolean
}

export interface LaneArgs {
    json: boolean
    base: string | undefined
    files: string | undefined
}

export interface CheckArgs extends LaneArgs {
    dryRun: boolean
    smoke: boolean
    e2e: boolean
}

export interface RunnableCheckStep {
    name: string
    cmd: string[]
    reason?: undefined
}

export interface SkippedCheckStep {
    name: string
    cmd?: undefined
    reason: string
}

export type CheckStep = RunnableCheckStep | SkippedCheckStep

export interface DocEntry {
    file: string
    title: string
    hint?: string
}

export interface PackageManifest {
    name?: string
    description?: string
}

export interface PackageArgs {
    name: string | undefined
    print: boolean
    vitestArgs: string[]
}
