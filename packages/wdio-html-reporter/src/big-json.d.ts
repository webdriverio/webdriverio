declare module 'big-json' {
    const json: {
        stringify (opts: { body: unknown }): Promise<string>
    }
    export default json
}
