export default Promise.resolve({
    base: '/from-file',
    define: { __FROM_USER__: JSON.stringify('promise') },
    plugins: [(globalThis as any).__wdioUserVitePlugin__]
})
