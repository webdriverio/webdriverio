/* eslint-disable brace-style */
/* eslint-disable camelcase */
/* istanbul ignore file */
/**
 * original source: https://github.com/Georgegriff/query-selector-shadow-dom
 * Copyright by https://github.com/Georgegriff
 */
export default function querySelectorAllDeep (findMany: boolean, s: string, r: Element | Document) {
    function normalizeSelector (sel: string) {
        // save unmatched text, if any
        function saveUnmatched() {
            if (unmatched) {
                // whitespace needed after combinator?
                if (tokens.length > 0 && /^[~+>]$/.test(tokens[tokens.length - 1])) {
                    tokens.push(' ')
                }

                // save unmatched text
                tokens.push(unmatched)
            }
        }

        const tokens: string[] = [],
            state = [0],
            not_escaped_pattern = /(?:[^\\]|(?:^|[^\\])(?:\\\\)+)$/,
            whitespace_pattern = /^\s+$/,
            state_patterns = [
                /\s+|\/\*|["'>~+[(]/g, // general
                /\s+|\/\*|["'[\]()]/g, // [..] set
                /\s+|\/\*|["'[\]()]/g, // (..) set
                null, // string literal (placeholder)
                /\*\//g, // comment
            ] as RegExp[]
        let match,
            unmatched: string,
            regex: RegExp,
            next_match_idx = 0,
            prev_match_idx
        sel = sel.trim()

        // eslint-disable-next-line no-constant-condition
        while (true) {
            unmatched = ''

            regex = state_patterns[state[state.length - 1]]

            regex.lastIndex = next_match_idx
            match = regex.exec(sel)

            // matched text to process?
            if (match) {
                prev_match_idx = next_match_idx
                next_match_idx = regex.lastIndex

                // collect the previous string chunk not matched before this token
                if (prev_match_idx < next_match_idx - match[0].length) {
                    unmatched = sel.substring(
                        prev_match_idx,
                        next_match_idx - match[0].length
                    )
                }

                // general, [ ] pair, ( ) pair?
                if (state[state.length - 1] < 3) {
                    saveUnmatched()

                    // starting a [ ] pair?
                    if (match[0] === '[') {
                        state.push(1)
                    }
                    // starting a ( ) pair?
                    else if (match[0] === '(') {
                        state.push(2)
                    }
                    // starting a string literal?
                    else if (/^["']$/.test(match[0])) {
                        state.push(3)
                        state_patterns[3] = new RegExp(match[0], 'g')
                    }
                    // starting a comment?
                    else if (match[0] === '/*') {
                        state.push(4)
                    }
                    // ending a [ ] or ( ) pair?
                    else if (/^[\])]$/.test(match[0]) && state.length > 0) {
                        state.pop()
                    }
                    // handling whitespace or a combinator?
                    else if (/^(?:\s+|[~+>])$/.test(match[0])) {
                        // need to insert whitespace before?
                        if (
                            tokens.length > 0 &&
                            !whitespace_pattern.test(tokens[tokens.length - 1]) &&
                            state[state.length - 1] === 0
                        ) {
                            // add normalized whitespace
                            tokens.push(' ')
                        }

                        // case-insensitive attribute selector CSS L4
                        if (
                            state[state.length - 1] === 1 &&
                            tokens.length === 5 &&
                            tokens[2].charAt(tokens[2].length - 1) === '='
                        ) {
                            tokens[4] = ' ' + tokens[4]
                        }

                        // whitespace token we can skip?
                        if (whitespace_pattern.test(match[0])) {
                            continue
                        }
                    }

                    // save matched text
                    tokens.push(match[0])
                }
                // otherwise, string literal or comment
                else {
                    // save unmatched text
                    tokens[tokens.length - 1] += unmatched

                    // unescaped terminator to string literal or comment?
                    if (not_escaped_pattern.test(tokens[tokens.length - 1])) {
                        // comment terminator?
                        if (state[state.length - 1] === 4) {
                            // ok to drop comment?
                            if (
                                tokens.length < 2 ||
                                whitespace_pattern.test(tokens[tokens.length - 2])
                            ) {
                                tokens.pop()
                            }
                            // otherwise, turn comment into whitespace
                            else {
                                tokens[tokens.length - 1] = ' '
                            }

                            // handled already
                            match[0] = ''
                        }

                        state.pop()
                    }

                    // append matched text to existing token
                    tokens[tokens.length - 1] += match[0]
                }
            }
            // otherwise, end of processing (no more matches)
            else {
                unmatched = sel.substr(next_match_idx)
                saveUnmatched()

                break
            }
        }

        return tokens.join('').trim()
    }

    function _querySelectorDeep(selector: string, root: Element | Document, allElements = null) {
        selector = normalizeSelector(selector)
        const lightElement = root.querySelector(selector)

        // @ts-expect-error createShadowRoot does not exist in head
        if (document.head.createShadowRoot || document.head.attachShadow) {
            // no need to do any special if selector matches something specific in light-dom
            if (!findMany && lightElement) {
                return lightElement
            }

            // split on commas because those are a logical divide in the operation
            const selectionsToMake = splitByCharacterUnlessQuoted(selector, ',')

            return selectionsToMake.reduce((acc: any, minimalSelector: any) => {
                // if not finding many just reduce the first match
                if (!findMany && acc) {
                    return acc
                }
                // do best to support complex selectors and split the query
                const splitSelector = splitByCharacterUnlessQuoted(minimalSelector
                    //remove white space at start of selector
                    .replace(/^\s+/g, '')
                    .replace(/\s*([>+~]+)\s*/g, '$1'), ' ')
                    // filter out entry white selectors
                    .filter((entry: unknown) => !!entry)
                    // convert "a > b" to ["a", "b"]
                    .map((entry: string) => splitByCharacterUnlessQuoted(entry, '>'))

                const possibleElementsIndex = splitSelector.length - 1
                const lastSplitPart = splitSelector[possibleElementsIndex][splitSelector[possibleElementsIndex].length - 1]
                const possibleElements = collectAllElementsDeep(lastSplitPart, root, allElements)
                const findElements = findMatchingElement(splitSelector, possibleElementsIndex, root)
                if (findMany) {
                    acc = acc.concat(possibleElements.filter(findElements))
                    return acc
                }
                acc = possibleElements.find(findElements)
                return acc || null
            }, findMany ? [] : null)
        }

        return !findMany
            ? lightElement
            : root.querySelectorAll(selector)
    }

    function findMatchingElement(splitSelector: string, possibleElementsIndex: number, root: Document | Element) {
        return (element: Element) => {
            let position = possibleElementsIndex
            let parent = element
            let foundElement = false
            while (parent && !isDocumentNode(parent)) {
                let foundMatch = true
                if (splitSelector[position].length === 1) {
                    foundMatch = parent.matches(splitSelector[position])
                } else {
                    // selector is in the format "a > b"
                    // make sure a few parents match in order
                    const reversedParts = ([]).concat(splitSelector[position] as any).reverse()
                    let newParent = parent
                    for (const part of reversedParts) {
                        if (!newParent || !newParent.matches(part)) {
                            foundMatch = false
                            break
                        }
                        newParent = findParentOrHost(newParent, root)
                    }
                }

                if (foundMatch && position === 0) {
                    foundElement = true
                    break
                }
                if (foundMatch) {
                    position--
                }
                parent = findParentOrHost(parent, root)
            }
            return foundElement
        }
    }

    function splitByCharacterUnlessQuoted(selector: string, character: string) {
        return selector.match(/\\?.|^$/g)!.reduce((p, c) => {
            if (c === '"' && !p.sQuote) {
                p.quote ^= 1
                p.a[p.a.length - 1] += c
            } else if (c === '\'' && !p.quote) {
                p.sQuote ^= 1
                p.a[p.a.length - 1] += c

            } else if (!p.quote && !p.sQuote && c === character) {
                p.a.push('')
            } else {
                p.a[p.a.length - 1] += c
            }
            return p
        }, { a: [''] } as any).a
    }

    /**
     * Checks if the node is a document node or not.
     * @param {Node} node
     * @returns {node is Document | DocumentFragment}
     */
    function isDocumentNode(node: Element) {
        return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_NODE
    }

    function findParentOrHost(element: Element, root: Element | Document) {
        const parentNode = element.parentNode
        // @ts-expect-error
        return (parentNode && parentNode.host && parentNode.nodeType === 11)
            // @ts-expect-error
            ? parentNode.host
            : parentNode === root
                ? null
                : parentNode
    }

    /**
     * Finds all elements on the page, inclusive of those within shadow roots.
     * @param {string=} selector Simple selector to filter the elements by. e.g. 'a', 'div.main'
     * @return {!Array<string>} List of anchor hrefs.
     * @author ebidel@ (Eric Bidelman)
     * License Apache-2.0
     */
    function collectAllElementsDeep(selector = null, root: Document | Element, cachedElements = null) {
        let allElements: Element[] = []

        if (cachedElements) {
            allElements = cachedElements
        } else {
            const findAllElements = function(nodes: NodeListOf<Element>) {
                for (let i = 0; i < nodes.length; i++) {
                    const el = nodes[i]
                    allElements.push(el)
                    // If the element has a shadow root, dig deeper.
                    if (el.shadowRoot) {
                        findAllElements(el.shadowRoot.querySelectorAll('*'))
                    }
                }
            }
            if ((root as Element).shadowRoot) {
                findAllElements((root as Element).shadowRoot?.querySelectorAll('*')!)
            }
            findAllElements(root.querySelectorAll('*'))
        }

        return selector ? allElements.filter(el => el.matches(selector)) : allElements
    }

    return _querySelectorDeep(s, r || document)
}
