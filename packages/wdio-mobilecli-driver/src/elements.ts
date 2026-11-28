import { randomUUID } from 'node:crypto'

import { findNodes, type Strategy, type TreeNode } from './tree.js'

/**
 * How an element was found. mobilecli has no element ids, so the driver
 * finds the element again with this in the UI tree of every command.
 */
export interface ElementQuery {
    using: Strategy
    value: string
    /**
     * the position in the elements that the selector matches
     */
    index: number
}

/**
 * what the driver saw of an element the last time it looked at the screen
 */
export interface Observation {
    node: TreeNode
    /**
     * when, in ms
     */
    at: number
    /**
     * the element was at the same place the time before
     */
    stable: boolean
}

/**
 * an error with the name of a WebDriver error, which is what WebdriverIO
 * looks at
 */
export class ElementError extends Error {
    constructor (name: 'stale element reference' | 'no such element', message: string) {
        super(message)
        this.name = name
    }
}

/**
 * The elements of a session: the ids that the driver gave to WebdriverIO
 * and how to find each of them again.
 */
export class ElementRegistry {
    #queries = new Map<string, ElementQuery>()
    #ids = new Map<string, string>()
    #seen = new Map<string, Observation>()

    /**
     * the id of an element. The same query gets the same id, as an element
     * has one id in WebDriver no matter how often it is found.
     */
    register (query: ElementQuery): string {
        const key = JSON.stringify([query.using, query.value, query.index])
        let id = this.#ids.get(key)
        if (!id) {
            id = randomUUID()
            this.#ids.set(key, id)
            this.#queries.set(id, query)
        }
        return id
    }

    /**
     * how a registered element was found
     * @throws `no such element` if the id is not of this session
     */
    getQuery (elementId: string): ElementQuery {
        const query = this.#queries.get(elementId)
        if (!query) {
            throw new ElementError('no such element', `The element with the id "${elementId}" is not known in this session`)
        }
        return query
    }

    /**
     * Remember an element as it was on the screen in a look at `at`. It is
     * stable if it was at the same place in a look before that one, at most
     * `window` ms earlier.
     */
    observe (elementId: string, node: TreeNode, window: number, at: number): Observation {
        const now = at
        const previous = this.#seen.get(elementId)
        const { x, y, width, height } = node.rect
        const stable = previous !== undefined && previous.at < now && now - previous.at <= window &&
            previous.node.rect.x === x && previous.node.rect.y === y &&
            previous.node.rect.width === width && previous.node.rect.height === height
        const observation = { node, at: now, stable }
        this.#seen.set(elementId, observation)
        return observation
    }

    /**
     * what was seen of an element at most `maxAge` ms ago
     */
    getObservation (elementId: string, maxAge: number): Observation | undefined {
        const observation = this.#seen.get(elementId)
        return observation && Date.now() - observation.at < maxAge ? observation : undefined
    }

    /**
     * Forget what was seen of one element: a newer look did not find it.
     * Without this a read right after could still use what an older look
     * saw of it.
     */
    forgetObservation (elementId: string) {
        this.#seen.delete(elementId)
    }

    /**
     * forget what was seen: the driver did something on the screen
     */
    forgetObservations () {
        this.#seen.clear()
    }

    /**
     * Find a registered element in a UI tree.
     * @throws `no such element` if the id is not of this session,
     *         `stale element reference` if the element is not on the screen
     *         anymore. WebdriverIO then finds the element again.
     */
    resolve (elementId: string, tree: TreeNode[], platform: string): TreeNode {
        const query = this.getQuery(elementId)
        const node = findNodes(tree, platform, query.using, query.value)[query.index]
        if (!node) {
            throw new ElementError(
                'stale element reference',
                `The element with the selector "${query.value}" (${query.using}) is not on the screen anymore`
            )
        }
        return node
    }

    clear () {
        this.#queries.clear()
        this.#ids.clear()
        this.#seen.clear()
    }
}
