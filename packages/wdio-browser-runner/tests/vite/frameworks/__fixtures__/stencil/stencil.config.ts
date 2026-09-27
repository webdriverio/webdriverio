export const config = {
    plugins: [{
        name: 'esbuild-plugin',
        options: {
            include: ['foo', 'bar']
        }
    }]
}
