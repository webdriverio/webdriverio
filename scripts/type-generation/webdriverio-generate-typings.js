#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const dox = require('dox');

const elementDir = path.resolve(__dirname + '../../../packages/webdriverio/src/commands/element');
const elementCommands = fs.readdirSync(elementDir);

const browserDir = path.resolve(__dirname + '../../../packages/webdriverio/src/commands/browser');
const browserCommands = fs.readdirSync(browserDir);

let allTypeLines = [];

const changeType = (text) => {
    if (text.indexOf('Array.') > -1) {
        const arrayText = 'Array.<'
        text = text.substring(arrayText.length, text.length - 1) + '[]';
    }

    switch (text) {
        case 'Buffer':
        case 'Function':
        case 'RegExp': {
            break;
        }
        case 'Element': {
            text = 'Element<void>';
            break;
        }
        default: {
            text = text.toLowerCase();
        }

    }
    return text;
}

const getTypes = (types, alwaysType) => {
    types.forEach((type, index, array) => {
        array[index] = changeType(type);
    });
    types = types.join(' | ');
    if (types === '' && !alwaysType) {
        types = 'undefined'
    } else if (types === '*' || (types === '' && alwaysType)) {
        types = 'any'
    }

    return types;
}

const gatherCommands = (commandPath, commandFile) => {
    const commandContents = fs.readFileSync(commandPath).toString();
    const commandDocs = dox.parseComments(commandContents);
    const commandTags = commandDocs[0].tags;
    
    const allParameters = [];
    let returnType = 'undefined';

    for ({type, name, optional, types} of commandTags) {
        if (type === 'param') {
            let commandTypes = getTypes(types, true);

            // console.log(commandTag.name)
            if (name.indexOf('.') < 0) {
                allParameters.push(`${name}${optional ? '?' : ''}: ${commandTypes}`);
            }
        }

        if (type === 'return') {
            returnType = getTypes(types, false);
        }
    }

    const commandName = commandFile.substr(0, commandFile.indexOf('.js'));
    if (commandName !== '$' && commandName !== '$$' && commandName !== 'waitUntil') {
        allTypeLines.push(`${commandName}(${allParameters.length > 0 ? '\n            ' : ''}${allParameters.join(',\n            ')}${allParameters.length > 0 ? '\n        ' : ''}): ${returnType}`);
    }

    return allTypeLines;
}

let bCommands = [];
browserCommands.forEach((commandFile) => {
    const commandPath = path.resolve(`${browserDir}/${commandFile}`);
    bCommands = gatherCommands(commandPath, commandFile);
});
const allBrowserCommands = `${bCommands.join(';\n        ')};`;

allTypeLines = [];

let eCommands = [];
elementCommands.forEach((commandFile) => {
    const commandPath = path.resolve(`${elementDir}/${commandFile}`);
    eCommands = gatherCommands(commandPath, commandFile);
});

const allElementCommands = `${eCommands.join(';\n        ')};`;

const templatePath = path.resolve(__dirname + '../../templates/webdriverio.tpl.d.ts')
const templateContents = fs.readFileSync(templatePath, 'utf8');

let typingsContents = templateContents.replace('// ... element commands ...', allElementCommands)
typingsContents = typingsContents.replace('// ... browser commands ...', allBrowserCommands);

const outputFile = path.join(__dirname, '..', '..', 'packages/webdriverio/lib', 'webdriverio.d.ts');
fs.writeFileSync(outputFile, typingsContents, { encoding: 'utf-8' })

console.log(`Generated typings file at ${outputFile}`);