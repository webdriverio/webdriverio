declare module WebdriverIO {
    interface ServiceOption extends StaticServerOptions {}
}

interface StaticServerOptions {
    /**
     * Array of folder paths and mount points.
     */
    folders?: Array<object>;
    /**
     * Port to bind the server.
     */
    port?: number;
    /**
     * Array of middleware objects. Load and instatiate these in the config,
     * and pass them in for the static server to use.
     */
    middleware?: Array<object>;
}
