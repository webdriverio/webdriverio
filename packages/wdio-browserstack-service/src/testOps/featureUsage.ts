class FeatureUsage {
    private isTriggered?: boolean
    private status?: string
    private error?: string

    constructor(isTriggered?: boolean) {
        if (isTriggered !== undefined) {
            this.isTriggered = isTriggered
        }
    }

    public getTriggered(): boolean | undefined {
        return this.isTriggered
    }

    public setTriggered(triggered: boolean): void {
        this.isTriggered = triggered
    }

    public setStatus(status: string): void {
        this.status = status
    }

    public setError(error: string): void {
        this.error = error
    }

    public triggered(): void {
        this.isTriggered = true
    }

    public failed(e: unknown): void {
        this.status = 'failed'
        if (typeof e === 'string') {
            this.error = e // works, `e` narrowed to string
        } else if (e instanceof Error) {
            this.error = e.message // works, `e` narrowed to Error
        }
    }

    public success(): void {
        this.status = 'success'
    }

    public getStatus(): string | undefined {
        return this.status
    }

    public getError(): string | undefined {
        return this.error
    }

    public toJSON() {
        return {
            isTriggered: this.isTriggered,
            status: this.status,
            error: this.error
        }
    }

    public static fromJSON(data: any) {
        const usage = new FeatureUsage()
        usage.setTriggered(data.getTriggered())
        usage.setStatus(data.getStatus())
        usage.setError(data.getError())
        return data
    }
}

export default FeatureUsage
