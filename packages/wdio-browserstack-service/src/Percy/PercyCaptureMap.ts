/*
 * Maintains a counter for each driver to get consistent and
 * unique screenshot names for percy
 */

class PercyCaptureMap {
    #map: any = {}

    increment(sessionName: string, eventName: string) {
        if (!this.#map[sessionName]) {
            this.#map[sessionName] = {}
        }

        if (!this.#map[sessionName][eventName]) {
            this.#map[sessionName][eventName] = 0
        }

        this.#map[sessionName][eventName]++
    }

    decrement(sessionName: string, eventName: string) {
        if (!this.#map[sessionName] || !this.#map[sessionName][eventName]) {
            return
        }

        this.#map[sessionName][eventName]--
    }

    getName(sessionName: string, eventName: string) {
        return `${sessionName}-${eventName}-${this.get(sessionName, eventName)}`
    }

    get(sessionName: string, eventName: string) {
        if (!this.#map[sessionName]) {
            return 0
        }

        if (!this.#map[sessionName][eventName]) {
            return 0
        }

        return this.#map[sessionName][eventName] - 1
    }
}

export default PercyCaptureMap
