exports.config = {
    specs: ['IDONTEXIST.js'],
    beforeSession: () => {},
    afterSession: () => {},
    capabilities: [{
        browserName: 'doesntmatter'
    }]
}
