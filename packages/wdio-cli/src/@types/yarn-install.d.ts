declare module 'yarn-install' {
    export default function yarnInstall (
        params: {
            deps: string[]
            cwd?: string
            registry?: string
            dev?: boolean
            global?: boolean
            remove?: boolean
            production?: boolean
            respectNpm5?: boolean
        }
    ): {
        stderr: string
        status: number
    }
}
