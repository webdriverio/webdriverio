import logger from '@wdio/logger'
import { getHighResTime } from './timing.js'
import { LOG_PREFIX } from './constants.js'

const log = logger('@wdio/appium-service:selector-optimizer')

/**
 * Extracts matching elements from page source for debugging.
 */
async function extractMatchingElementsFromPageSource(
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    using: string,
    value: string
): Promise<string[]> {
    try {
        const browserWithPageSource = browser as WebdriverIO.Browser & {
            getPageSource: () => Promise<string>
        }
        const pageSource = await browserWithPageSource.getPageSource()

        if (!pageSource || typeof pageSource !== 'string') {
            return []
        }

        const matchingElements: string[] = []

        if (using === '-ios predicate string') {
            const typeMatch = value.match(/type\s*==\s*'([^']+)'/)
            const elementType = typeMatch ? typeMatch[1] : null

            const conditions: Array<{ attr: string, value: string }> = []
            const attrPattern = /(\w+)\s*==\s*'([^']+)'/g
            let attrMatch: RegExpExecArray | null
            while ((attrMatch = attrPattern.exec(value)) !== null) {
                if (attrMatch[1] !== 'type') {
                    conditions.push({ attr: attrMatch[1], value: attrMatch[2] })
                }
            }

            if (!elementType) {
                return []
            }

            const elementPattern = new RegExp(`<${elementType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^>]*)>`, 'gi')

            let match: RegExpExecArray | null
            while ((match = elementPattern.exec(pageSource)) !== null) {
                const attrs = match[1] || ''
                let matches = true

                for (const condition of conditions) {
                    const attrPattern = new RegExp(`${condition.attr}="([^"]*)"`, 'i')
                    const attrMatch = attrs.match(attrPattern)
                    if (!attrMatch || attrMatch[1] !== condition.value) {
                        matches = false
                        break
                    }
                }

                if (matches) {
                    matchingElements.push(match[0])
                }
            }
        } else if (using === '-ios class chain') {
            const typeMatch = value.match(/^\*\*\/(\w+)/)
            const elementType = typeMatch ? typeMatch[1] : null

            if (elementType) {
                const predicateMatch = value.match(/\[`([^`]+)`\]/)
                const conditions: Array<{ attr: string, value: string }> = []

                if (predicateMatch) {
                    const predicateContent = predicateMatch[1]
                    const attrPattern = /(\w+)\s*==\s*"([^"]+)"/g
                    let attrMatch: RegExpExecArray | null
                    while ((attrMatch = attrPattern.exec(predicateContent)) !== null) {
                        conditions.push({ attr: attrMatch[1], value: attrMatch[2] })
                    }
                }

                const elementPattern = new RegExp(`<${elementType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^>]*)>`, 'gi')
                let match: RegExpExecArray | null
                while ((match = elementPattern.exec(pageSource)) !== null) {
                    const attrs = match[1] || ''
                    let matches = true

                    for (const condition of conditions) {
                        const attrPattern = new RegExp(`${condition.attr}="([^"]*)"`, 'i')
                        const attrMatch = attrs.match(attrPattern)
                        if (!attrMatch || attrMatch[1] !== condition.value) {
                            matches = false
                            break
                        }
                    }

                    if (matches) {
                        matchingElements.push(match[0])
                    }
                }
            }
        }

        return matchingElements
    } catch {
        return []
    }
}

/**
 * Tests an optimized selector and returns the element reference and duration.
 */
export async function testOptimizedSelector(
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    using: string,
    value: string,
    isMultiple: boolean,
    debug: boolean = false
): Promise<{ elementRefs: Array<{ [key: string]: string }>, duration: number } | null> {
    try {
        if (debug) {
            log.debug(`[${LOG_PREFIX}: Debug] Step 1: Preparing to call findElement${isMultiple ? 's' : ''}`)
            log.debug(`[${LOG_PREFIX}: Debug] Step 1.1: Using strategy: "${using}"`)
            log.debug(`[${LOG_PREFIX}: Debug] Step 1.2: Selector value: "${value}"`)
            log.debug(`[${LOG_PREFIX}: Debug] Step 1.3: Multiple elements: ${isMultiple}`)
        }

        const startTime = getHighResTime()
        const browserWithProtocol = browser as WebdriverIO.Browser & {
            findElement: (using: string, value: string) => Promise<{ [key: string]: string }>
            findElements: (using: string, value: string) => Promise<Array<{ [key: string]: string }>>
        }

        if (debug) {
            log.debug(`[${LOG_PREFIX}: Debug] Step 2: Executing findElement${isMultiple ? 's' : ''}(${JSON.stringify(using)}, ${JSON.stringify(value)})`)
        }

        let elementRefs: Array<{ [key: string]: string }> = []
        let duration: number

        if (isMultiple) {
            const result = await browserWithProtocol.findElements(using, value)
            duration = getHighResTime() - startTime
            elementRefs = Array.isArray(result) ? result : []

            if (debug) {
                log.debug(`[${LOG_PREFIX}: Debug] Step 3: findElements() completed`)
                log.debug(`[${LOG_PREFIX}: Debug] Step 3.1: Found ${elementRefs.length} element(s)`)
                if (elementRefs.length > 0) {
                    log.debug(`[${LOG_PREFIX}: Debug] Step 3.2: Element reference(s): ${JSON.stringify(elementRefs)}`)
                } else {
                    log.debug(`[${LOG_PREFIX}: Debug] Step 3.2: No elements found - selector may not match any elements`)
                }
                log.debug(`[${LOG_PREFIX}: Debug] Step 3.3: Execution time: ${duration.toFixed(2)}ms`)
            }
        } else {
            const result = await browserWithProtocol.findElement(using, value)
            duration = getHighResTime() - startTime

            const isError = result && typeof result === 'object' && 'error' in result
            const isValidElement = result && !isError && (('ELEMENT' in result) || ('element-6066-11e4-a52e-4f735466cecf' in result))

            elementRefs = isValidElement ? [result as { [key: string]: string }] : []

            if (debug) {
                log.debug(`[${LOG_PREFIX}: Debug] Step 3: findElement() completed`)
                if (isError) {
                    log.debug(`[${LOG_PREFIX}: Debug] Step 3.1: Element NOT found - error returned`)
                    const errorMsg = (result as { error?: string, message?: string }).message || (result as { error?: string }).error || 'Unknown error'
                    log.debug(`[${LOG_PREFIX}: Debug] Step 3.2: Error details: ${errorMsg}`)
                } else if (isValidElement) {
                    log.debug(`[${LOG_PREFIX}: Debug] Step 3.1: Element found successfully`)
                    log.debug(`[${LOG_PREFIX}: Debug] Step 3.2: Element reference: ${JSON.stringify(result)}`)
                } else {
                    log.debug(`[${LOG_PREFIX}: Debug] Step 3.1: No element found - selector may not match any element`)
                }
                log.debug(`[${LOG_PREFIX}: Debug] Step 3.3: Execution time: ${duration.toFixed(2)}ms`)
            }
        }

        if (debug) {
            if (elementRefs.length > 0) {
                log.debug(`[${LOG_PREFIX}: Debug] Step 4: Verification successful - selector is valid and found element(s)`)
            }
            if (elementRefs.length === 0) {
                log.debug(`[${LOG_PREFIX}: Debug] Step 4: Verification failed - selector did not find any element(s)`)
                log.debug(`[${LOG_PREFIX}: Debug] Step 5: Collecting fresh page source to investigate...`)
                log.debug(`[${LOG_PREFIX}: Debug] Step 5.0: Searching for elements matching: ${using}="${value}"`)

                const matchingElements = await extractMatchingElementsFromPageSource(browser, using, value)

                if (matchingElements.length > 0) {
                    log.debug(`[${LOG_PREFIX}: Debug] Step 5.1: Found ${matchingElements.length} matching element(s) in fresh page source:`)
                    matchingElements.forEach((element, index) => {
                        const truncated = element.length > 200 ? element.substring(0, 200) + '...' : element
                        log.debug(`[${LOG_PREFIX}: Debug] Step 5.1.${index + 1}: ${truncated}`)
                    })
                    log.debug(`[${LOG_PREFIX}: Debug] Step 5.2: Retrying selector with fresh page source state...`)

                    const retryStartTime = getHighResTime()
                    try {
                        if (isMultiple) {
                            const retryResult = await browserWithProtocol.findElements(using, value)
                            const retryDuration = getHighResTime() - retryStartTime
                            const retryElementRefs = Array.isArray(retryResult) ? retryResult : []

                            if (retryElementRefs.length > 0) {
                                log.debug(`[${LOG_PREFIX}: Debug] Step 5.3: Retry successful! Found ${retryElementRefs.length} element(s) in ${retryDuration.toFixed(2)}ms`)
                                return { elementRefs: retryElementRefs, duration: retryDuration }
                            }
                            log.debug(`[${LOG_PREFIX}: Debug] Step 5.3: Retry failed - still no elements found (${retryDuration.toFixed(2)}ms)`)
                        } else {
                            const retryResult = await browserWithProtocol.findElement(using, value)
                            const retryDuration = getHighResTime() - retryStartTime

                            const isError = retryResult && typeof retryResult === 'object' && 'error' in retryResult
                            const isValidElement = retryResult && !isError && (('ELEMENT' in retryResult) || ('element-6066-11e4-a52e-4f735466cecf' in retryResult))
                            const retryElementRefs = isValidElement ? [retryResult as { [key: string]: string }] : []

                            if (retryElementRefs.length > 0) {
                                log.debug(`[${LOG_PREFIX}: Debug] Step 5.3: Retry successful! Found element in ${retryDuration.toFixed(2)}ms`)
                                return { elementRefs: retryElementRefs, duration: retryDuration }
                            }
                            const errorMsg = isError
                                ? ((retryResult as { error?: string, message?: string }).message || (retryResult as { error?: string }).error || 'Unknown error')
                                : 'No element found'
                            log.debug(`[${LOG_PREFIX}: Debug] Step 5.3: Retry failed - ${errorMsg} (${retryDuration.toFixed(2)}ms)`)
                        }
                    } catch (retryError) {
                        const retryDuration = getHighResTime() - retryStartTime
                        log.debug(`[${LOG_PREFIX}: Debug] Step 5.3: Retry threw error: ${retryError instanceof Error ? retryError.message : String(retryError)} (${retryDuration.toFixed(2)}ms)`)
                    }
                } else {
                    log.debug(`[${LOG_PREFIX}: Debug] Step 5.1: No matching elements found in fresh page source - element may have disappeared`)
                }
            }
        }

        return { elementRefs, duration }
    } catch (error) {
        if (debug) {
            log.debug(`[${LOG_PREFIX}: Debug] Step 3: findElement${isMultiple ? 's' : ''}() threw an error`)
            log.debug(`[${LOG_PREFIX}: Debug] Step 3.1: Error: ${error instanceof Error ? error.message : String(error)}`)
            log.debug(`[${LOG_PREFIX}: Debug] Step 4: Verification failed - selector execution error`)
        }
        return null
    }
}
