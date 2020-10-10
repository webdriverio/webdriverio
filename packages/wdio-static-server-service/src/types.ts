export interface MiddleWareOption {
    mount: string,
    middleware: string
}

export interface FolderOption {
    mount: string,
    path: string
}

export interface StaticServerOptions {
    /**
     * Array of folder paths and mount points.
     */
    folders?: FolderOption[];
    /**
     * Port to bind the server.
     */
    port?: number;
    /**
     * Array of middleware objects. Load and instatiate these in the config,
     * and pass them in for the static server to use.
     */
    middleware?: MiddleWareOption[];
}
