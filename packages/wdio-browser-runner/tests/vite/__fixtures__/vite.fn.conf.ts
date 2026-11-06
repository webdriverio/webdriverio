export default ({ mode, command }: { mode: string, command: string }) => ({
    base: '/from-file',
    define: { __FROM_USER__: JSON.stringify(`${mode}:${command}`) },
    plugins: [(globalThis as any).__wdioUserVitePlugin__]
})
