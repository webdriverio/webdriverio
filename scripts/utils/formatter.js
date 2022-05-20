const path = require('node:path')

const { customFields } = require('../../website/docusaurus.config.js')

module.exports = function (docfile) {
    const javadoc = docfile.javadoc[0]

    let type = (javadoc.ctx && javadoc.ctx.type)
    const name = path.basename(path.basename(docfile.filename, '.js'), '.ts')
    const scope = docfile.filename.split('/').slice(-2, -1)[0]

    let description = ''
    let paramStr = []
    let propertyTags = []
    let paramTags = []
    let returnTags = []
    let throwsTags = []
    let fires = []
    let listens = []
    let tagDeprecated = false
    let tagSee = ''
    let tagVersion = ''
    let tagAuthor = ''
    let tagType = ''

    for (const tag of javadoc.tags) {
        if (tag.type == 'param') {
            tag.joinedTypes = tag.types.join('|').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

            if (tag.typesDescription.includes('|<code>undefined</code>')) {
                tag.typesDescription = `<code>${tag.joinedTypes}</code>`
            }

            paramTags.push(tag)
            paramStr.push(tag.name)
        } else if (tag.type == 'property') {
            tag.joinedTypes = tag.types.join('|').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            propertyTags.push(tag)
        } else if (tag.type == 'return' || tag.type == 'returns') {
            tag.joinedTypes = tag.types.join('|').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            returnTags.push(tag)
        } else if (tag.type == 'throws') {
            tag.joinedTypes = tag.types.join('|').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            throwsTags.push(tag)
        } else if (tag.type == 'fires') {
            fires.push(tag.string)
        } else if (tag.type == 'listens') {
            listens.push(tag.string)
        } else if (tag.type == 'namespace') {
            type = 'namespace'
        } else if (tag.type == 'method') {
            type = 'method'
        } else if (tag.type == 'class') {
            type = 'class'
        } else if (tag.type == 'function') {
            type = 'function'
        } else if (tag.type == 'event') {
            type = 'event'
        } else if (tag.type == 'see') {
            tagSee = tag.url ? tag.url : tag.local
        } else if (tag.type == 'version') {
            tagVersion = tag.string
        } else if (tag.type == 'deprecated') {
            tagDeprecated = true
        } else if (tag.type == 'author') {
            tagAuthor = tag.string
        } else if (tag.type == 'type') {
            tagType = tag.types.join('|').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        }
    }

    description = javadoc.description.full
        .replace(/\nh1/, '#')
        .replace(/\nh2/, '##')
        .replace(/\nh3/, '###')
        .replace(/\nh4/, '####')
        .replace(/\nh5/, '#####')
        .replace(/\nh6/, '######')
        .replace(/^h1/, '#')
        .replace(/^h2/, '##')
        .replace(/^h3/, '###')
        .replace(/^h4/, '####')
        .replace(/^h5/, '#####')
        .replace(/^h6/, '######')

    const files = []
    let exampleCodeLine = []
    let example = description.match(/<example>((.|\n)*)<\/example>/g)
    let exampleFilename = ''
    let currentLine = 0

    if (example && example[0]) {
        // eslint-disable-next-line no-console
        console.log('parse example section for', docfile.filename)

        example = example[0].replace(/<(\/)*example>/g, '').split(/\n/g)
        example.forEach(function(line) {
            ++currentLine

            var checkForFilenameExpression = line.match(/\s\s\s\s(:(\S)*\.(\S)*)/g)
            if ((checkForFilenameExpression && checkForFilenameExpression.length) || (currentLine === example.length)) {

                if (exampleCodeLine.length) {

                    /**
                     * remove filename expression in first line
                     */
                    exampleFilename = exampleCodeLine.shift().trim().substr(1)
                    var code = exampleCodeLine.join('\n')

                    /**
                     * add example
                     */
                    if (exampleFilename !== '' && code !== '') {
                        files.push({
                            file: exampleFilename,
                            format: exampleFilename.split(/\./).pop(),
                            code: code
                        })
                    }

                    /**
                     * reset loop conditions
                     */
                    exampleCodeLine = []
                }

                /**
                 * if this is the last line of code dont proceed
                 */
                if (currentLine === example.length) {
                    return
                }

            }

            exampleCodeLine.push(line.substr(4))
        })

        /**
         * remove example section from description
         */
        description = description.substr(0, description.indexOf('<example>'))
    }

    /**
     * format param strings, from
     * ```
     * browser.waitUntil(condition, options, options.timeout, options.reverse, options.timeoutMsg, options.interval)
     * ```
     * to
     * ```
     * browser.waitUntil(condition, { timeout, reverse, timeoutMsg, interval })
     * ```
     */
    const parsedParamStr = paramStr
        .filter((param, i) => !paramStr[i + 1] || paramStr[i + 1].split('.')[0] !== param)
        .filter((param) => !param.includes('.'))
    const paramOptions = paramStr.filter((param) => param.includes('.')).map((param) => param.split('.')[1])
    if (paramOptions.length) {
        parsedParamStr.push(`{ ${paramOptions.join(', ')} }`)
    }

    const commandDescription = {
        command: name,
        paramString: parsedParamStr.join(', '),
        paramTags: paramTags,
        propertyTags: propertyTags,
        returnTags: returnTags,
        throwsTags: throwsTags,
        fires: fires,
        listens: listens,
        author: tagAuthor,
        version: tagVersion,
        see: tagSee,
        deprecated: tagDeprecated,
        tagType: tagType,
        type: type,
        isMethod: type === 'method',
        isFunction: type === 'function',
        isClass: type === 'class',
        isNamespace: type === 'namespace',
        isEvent: type === 'event',
        hasType: tagType !== '',
        description: description,
        ignore: javadoc.ignore,
        examples: files,
        customEditUrl: `${customFields.repoUrl}/edit/main/packages/webdriverio/src/commands/${scope}/${name}.ts`,
        hasDocusaurusHeader: true,
        originalId: `api/${scope}/${name}`,
        isElementScope : scope === 'element',
        isNetworkScope : scope === 'network',
        isMockScope : scope === 'mock'
    }

    return commandDescription
}
