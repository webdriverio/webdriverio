// stub

type PolkaRequest = {
    path: string;
    method: string;
    body: Record<string, unknown>;
};

type PolkaResponse = {
    end: Function;
};

interface PolkaInstance {
    use: (use: any, cb: NextFn) => PolkaInstance;
    post: (
        path: string,
        cb: (req: PolkaRequest, res: PolkaResponse) => void
    ) => PolkaInstance;
    listen: Function;
    server: Partial<import("http").Server> & { address(): { post: string } };
}
type NextFn = (
    req: PolkaRequest,
    res: PolkaResponse,
    next: Function
) => PolkaInstance;

type Polka = () => PolkaInstance;
