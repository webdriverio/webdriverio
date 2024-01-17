declare namespace NodeJS {
    interface Process {
        private _getActiveHandles(): any[]
        _debugProcess: (pid: number) => void
        _debugEnd: (pid: number) => void
    }
}
