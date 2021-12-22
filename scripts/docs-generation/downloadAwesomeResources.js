const fs = require('fs')
const path = require('path')
const { downloadFromGitHub } = require('../utils')

exports.downloadAwesomeResources = async function () {
    const basePath = path.join(__dirname, '..', '..')
    const newDocsPath = path.join(basePath, 'website', 'community', 'Resources.md')
    const content = await downloadFromGitHub('https://raw.githubusercontent.com/webdriverio-community/awesome-webdriverio', 'main')
    let lines = content.toString().split(/\n/)
    lines = lines.slice(lines.findIndex((line) => line.includes('WebdriverIO Ecosystem')))
    await fs.promises.writeFile(newDocsPath, `---
id: resources
title: Resources
custom_edit_url: https://github.com/webdriverio-community/awesome-webdriverio/edit/main/README.md
---

There are many wonderful curated resources the WebdriverIO community has put together.
Make sure to contribute yours at [\`awesome-webdriverio\`](https://github.com/webdriverio-community/awesome-webdriverio)!

${lines.join('\n')}`)
}
