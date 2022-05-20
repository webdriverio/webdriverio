const fs = require('node:fs')
const path = require('node:path')

exports.copyContributingDocs = async function () {
    const basePath = path.join(__dirname, '..', '..')
    const docsPath = path.join(basePath, 'CONTRIBUTING.md')
    const newDocsPath = path.join(basePath, 'website', 'docs', 'Contribute.md')
    const content = await fs.promises.readFile(docsPath)
    await fs.promises.writeFile(newDocsPath, `---
id: contribute
title: Contribute
custom_edit_url: https://github.com/webdriverio/webdriverio/edit/main/CONTRIBUTING.md
---

${content.toString().split(/\n/).slice(2).join('\n')}`)
}
