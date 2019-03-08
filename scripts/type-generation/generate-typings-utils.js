
const changeType = (text) => {
    if (text.indexOf('Array.') > -1) {
        const arrayText = 'Array.<'
        text = text.substring(arrayText.length, text.length - 1) + '[]'
    }

    switch (text) {
    case 'Buffer':
    case 'Function':
    case 'RegExp':
    case 'Element':
    case 'Element[]': {
        break
    }
    default: {
        text = text.toLowerCase()
    }

    }
    return text
}

const getTypes = (types, alwaysType) => {
    types.forEach((type, index, array) => {
        array[index] = changeType(type)
    })
    types = types.join(' | ')
    if (types === '' && !alwaysType) {
        types = 'void'
    } else if (types === '*' || (types === '' && alwaysType)) {
        types = 'any'
    }

    return types
}

const buildCommand = (commandName, commandTags, indentation = 0) => {
    const allParameters = []
    let returnType = 'void'

    for (const { type, name, optional, types, string } of commandTags) {
        // dox parse {*} as string instead of types
        if (types && types.length === 0 && string.includes('{*}')) {
            types.push('*')
        }
        if (type === 'param') {
            let commandTypes = getTypes(types, true)

            // skipping param with dot in name that stands for Object properties description, ex: attachmentObject.name
            if (name.indexOf('.') < 0) {
                // get rid from default values from param name, ex: [paramName='someString'] will become paramName
                allParameters.push(`${name.split('[').pop().split('=')[0]}${optional ? '?' : ''}: ${commandTypes}`)
            }
        }

        if (type === 'return') {
            returnType = getTypes(types, false)
        }
    }

    return `${commandName}(${allParameters.length > 0 ? `\n${' '.repeat(8 + indentation)}` : ''}${allParameters.join(`,\n${' '.repeat(8 + indentation)}`)}${allParameters.length > 0 ? `\n${' '.repeat(4 + indentation)}` : ''}): ${returnType}`
}

module.exports = {
    buildCommand
}
