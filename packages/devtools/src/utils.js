import logger from '@wdio/logger'
import { commandCallStructure } from '@wdio/utils'
import { WebDriverProtocol } from '@wdio/protocols'

import { ELEMENT_KEY } from './constants'

const log = logger('remotedriver')

// todo move to utils
import { isValidParameter, getArgumentType } from 'webdriver/src/utils'

export const validate = function (command, parameters, variables, ref, args) {
    const commandParams = [...variables.map((v) => Object.assign(v, {
        /**
         * url variables are:
         */
        required: true, // always required as they are part of the endpoint
        type: 'string'  // have to be always type of string
    })), ...parameters]

    const commandUsage = `${command}(${commandParams.map((p) => p.name).join(', ')})`
    const moreInfo = `\n\nFor more info see ${ref}\n`
    const body = {}

    /**
     * parameter check
     */
    const minAllowedParams = commandParams.filter((param) => param.required).length
    if (args.length < minAllowedParams || args.length > commandParams.length) {
        const parameterDescription = commandParams.length
            ? `\n\nProperty Description:\n${commandParams.map((p) => `  "${p.name}" (${p.type}): ${p.description}`).join('\n')}`
            : ''

        throw new Error(
            `Wrong parameters applied for ${command}\n` +
            `Usage: ${commandUsage}` +
            parameterDescription +
            moreInfo
        )
    }

    /**
     * parameter type check
     */
    for (const [i, arg] of Object.entries(args)) {
        const commandParam = commandParams[i]

        if (!isValidParameter(arg, commandParam.type)) {
            /**
             * ignore if argument is not required
             */
            if (typeof arg === 'undefined' && !commandParam.required) {
                continue
            }

            throw new Error(
                `Malformed type for "${commandParam.name}" parameter of command ${command}\n` +
                `Expected: ${commandParam.type}\n` +
                `Actual: ${getArgumentType(arg)}` +
                moreInfo
            )
        }

        /**
         * rest of args are part of body payload
         */
        body[commandParams[i].name] = arg
    }

    log.info('COMMAND', commandCallStructure(command, args))
    return body
}

export function getPrototype (commandWrapper) {
    const prototype = {}

    for (const [endpoint, methods] of Object.entries(WebDriverProtocol)) {
        for (const [method, commandData] of Object.entries(methods)) {
            prototype[commandData.command] = { value: commandWrapper(method, endpoint, commandData) }
        }
    }

    return prototype
}

export async function findElement (instance, value) {
    const element = await instance.$(value)

    if (!element) {
        return new Error(`Element with selector "${value}" not found`)
    }

    const elementId = this.elementStore.set(element)
    return { [ELEMENT_KEY]: elementId }
}

export async function findElements (instance, value) {
    const elements = await instance.$$(value)

    if (elements.length === 0) {
        return elements
    }

    return elements.map((element) => ({
        [ELEMENT_KEY]: this.elementStore.set(element)
    }))
}
