import type { MockRequestEvent } from './types'

export class MockHandler {
    #mocks = new Map<string, MockRequestEvent>()

    get mocks () {
        return this.#mocks
    }

    addMock (mock: MockRequestEvent) {
        this.#mocks.set(mock.path, mock)
    }
}
