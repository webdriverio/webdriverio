import path from 'node:path'
import type { Block, Spec } from 'comment-parser'

const organizationName = 'webdriverio' // Usually your GitHub org/user name.
const projectName = 'webdriverio' // Usually your repo name.
const repoUrl = `https://github.com/${organizationName}/${projectName}`

interface TagType extends Spec {
    string: string
}

interface Example {
    file: string;
    format: string;
    code: string;
}

function normalizeSpec(spec: Spec): TagType {
    const ensureType = (currentType: string | undefined) => currentType || 'any'

    const trimDescription = (desc: string) =>
        desc && desc.endsWith('\n') ? desc.replace(/(\n)+$/, '') : desc

    const string = spec.source[0].source.split(`@${spec.tag}`)[1].trim()

    spec.type = ensureType(spec.type)
    spec.description = trimDescription(spec.description)

    return {
        ...spec,
        string,
    }
}

export default function (docfile: {
    filename: string;
    javadoc: Block[];
}) {
    const javadoc = docfile.javadoc[0]

    let type = ''
    const name = path.basename(path.basename(docfile.filename, '.js'), '.ts')
    const scope = docfile.filename.split('/').slice(-2, -1)[0]

    let description = ''
    const paramStr: string[] = []
    const propertyTags: TagType[] = []
    const paramTags: TagType[] = []
    const returnTags: TagType[] = []
    const throwsTags: TagType[] = []
    const fires: string[] = []
    const listens: string[] = []
    const exampleReferences: string[] = []
    let tagDeprecated = ''
    let tagSee = ''
    let tagVersion = ''
    let tagAuthor = ''
    let tagCustomType = ''
    let tagMobileElement = false
    let tagSkipUsage = false
    let returns

    for (const tag of javadoc.tags) {
        const newTag = normalizeSpec(tag)
        const { tag: tagName, type: tagType, description, string, source } = newTag
        const typeOnToken = source[0].tokens.type

        switch (tagName) {
        case 'param': {
            if (tagType.includes('=')) {
                newTag.optional = true
                newTag.type = newTag.type.replace('=', '')
            }

            if (!tagType.includes('`')) {
                newTag.type = `\`${newTag.type}\``
            }

            paramTags.push(newTag)
            paramStr.push(newTag.name)
            break
        }
        case 'rowInfo': {
            paramTags.push(newTag)
            break
        }
        case 'property': {
            propertyTags.push(newTag)
            break
        }
        case 'return':
        case 'returns': {
            returns = {
                type: newTag.type,
                name: newTag.tag,
                description: string.split(typeOnToken)[1]
            }
            returnTags.push(newTag)
            break
        }
        case 'throws': {
            newTag.name = newTag.tag
            newTag.description = string.split(typeOnToken)[1]
            throwsTags.push(newTag)
            break
        }
        case 'fires': {
            fires.push(description)
            break
        }
        case 'listens': {
            listens.push(description)
            break
        }
        case 'namespace': {
            type = 'namespace'
            break
        }
        case 'method': {
            type = 'method'
            break
        }
        case 'class': {
            type = 'class'
            break
        }
        case 'function': {
            type = 'function'
            break
        }
        case 'event': {
            type = 'event'
            break
        }
        case 'see': {
            tagSee = source[0].source.split('@see')[1].trim()
            break
        }
        case 'version': {
            tagVersion = source[0].source.split('@version')[1].trim()
            break
        }
        case 'deprecated': {
            tagDeprecated = source[0].source.split('@deprecated')[1].trim()
            break
        }
        case 'mobileElement': {
            tagMobileElement = true
            break
        }
        case 'skipUsage': {
            tagSkipUsage = true
            break
        }
        case 'author': {
            tagAuthor = description
            break
        }
        case 'type': {
            tagCustomType = source[0].source.split('@type')[1].trim()
            break
        }
        case 'example': {
            exampleReferences.push(source[0].source.split('@example')[1].trim())
            break
        }
        case 'alias':
        case 'for':
        case 'uses':
        case 'docs': {
            break
        }
        default:
            console.log('unknown tag ', tag.tag, ' in ', docfile.filename)
            break
        }
    }

    description = javadoc.description
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

    const files: Example[] = []
    let exampleCodeLine: string[] = []
    const example = description.match(/<example>((.|\n)*)<\/example>/g)
    let exampleFilename = ''
    let currentLine = 0

    if (example && example[0]) {
        console.log('parse example section for', docfile.filename)

        const exampleLines = example[0].replace(/<(\/)*example>/g, '').split(/\n/g)
        exampleLines.forEach(function(line: string) {
            ++currentLine

            const checkForFilenameExpression = line.match(/\s\s\s\s(:(\S)*\.(\S)*)/g)
            if ((checkForFilenameExpression && checkForFilenameExpression.length) || (currentLine === exampleLines.length)) {

                if (exampleCodeLine.length) {

                    /**
                     * remove filename expression in first line
                     */
                    exampleFilename = exampleCodeLine.shift()!.trim().slice(1)
                    const code = exampleCodeLine
                        .join('\n')
                        /**
                         * allow to have `@` in code, e.g. `@keyframes slidein { ... }`
                         * without it would be interpreted as a jsdoc tag
                         */
                        .replace('\\@', '@')

                    /**
                     * add example
                     */
                    if (exampleFilename !== '' && code !== '') {
                        files.push({
                            file: exampleFilename,
                            format: exampleFilename.split(/\./).pop() || 'js',
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
                if (currentLine === exampleLines.length) {
                    return
                }

            }

            exampleCodeLine.push(line.slice(4))
        })

        /**
         * remove example section from description
         */
        description = description.slice(0, description.indexOf('<example>'))
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
        returns: returns,
        author: tagAuthor,
        version: tagVersion,
        see: tagSee,
        deprecated: tagDeprecated,
        tagType: tagCustomType,
        type: type ? type : false,
        isMethod: type === 'method',
        isFunction: type === 'function',
        isClass: type === 'class',
        isNamespace: type === 'namespace',
        isEvent: type === 'event',
        hasType: tagCustomType !== '',
        description: description,
        examples: files,
        exampleReferences,
        customEditUrl: `${repoUrl}/edit/main/packages/webdriverio/src/commands/${scope}/${name}.ts`,
        hasDocusaurusHeader: true,
        originalId: `api/${scope}/${name}`,
        isElementScope: scope === 'element' || tagMobileElement,
        isSkipUsage: tagSkipUsage,
        isNetworkScope : scope === 'network',
        isMockScope : scope === 'mock',
        isDialogScope : scope === 'dialog',
        isClockScope : scope === 'clock',
    }

    return commandDescription
}
