// stub
// polka doesn't have up to date types
// and the project is not maintained for 2 years

declare module '@polka/parse';

declare module 'polka' {
    function polka(): PolkaInstance;
    export = polka;
}

type PolkaRequest = {
    path: string;
    method: string;
    body: Record<string, unknown>;
    params: Record<string, unknown>;
    query: Record<string, unknown>;
};

type PolkaResponse = {
    end: Function;
};

interface PolkaInstance {
    use: (use: any, cb: NextFn) => PolkaInstance;
    post: (
        path: string,
        cb: (req: PolkaRequest, res: PolkaResponse, next: Function) => void
    ) => PolkaInstance;
    get: (
        path: string,
        cb: (req: PolkaRequest, res: PolkaResponse, next: Function) => void
    ) => PolkaInstance;
    listen: Function;
    server: Partial<import("http").Server> & { address(): { post: string } };
}
type NextFn = (
    req: PolkaRequest,
    res: PolkaResponse,
    next: Function
) => PolkaInstance;
