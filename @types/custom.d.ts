declare namespace NodeJS {
    interface Process {
        _debugProcess: (pid: number) => void
        _debugEnd: (pid: number) => void
    }
}
