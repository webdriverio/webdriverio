const fs = require('fs')
const path = require('path')

exports.copyContributingDocs = async function () {
    const basePath = path.join(__dirname, '..', '..')
    const docsPath = path.join(basePath, 'CONTRIBUTING.md')
    const newDocsPath = path.join(basePath, 'website', 'docs', 'Contribute.md')
    const content = await fs.promises.readFile(docsPath)
    await fs.promises.writeFile(newDocsPath, `---
id: contribute
title: Contribute
---

${content.toString().split(/\n/).slice(2).join('\n')}`)
}
