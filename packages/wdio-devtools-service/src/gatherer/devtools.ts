export interface CDPSessionOnMessageObject {
    id?: number;
    method: string;
    params: Record<string, unknown>;
    error: {
        message: string;
        data: any;
    };
    result?: any;
}

export default class DevtoolsGatherer {
    private _logs: CDPSessionOnMessageObject[] = []

    onMessage (msgObj: CDPSessionOnMessageObject) {
        this._logs.push(msgObj)
    }

    /**
     * retrieve logs and clean cache
     */
    getLogs () {
        return this._logs.splice(0, this._logs.length)
    }
}
