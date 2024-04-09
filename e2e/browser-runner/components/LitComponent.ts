import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { GraphQLClient, gql } from 'graphql-request'

import { GREETING } from './constants.js'

const endpoint = 'https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr'
const graphQLClient = new GraphQLClient(endpoint, {
    headers: { authorization: 'Bearer MY_TOKEN' }
})

@customElement('sub-elem')
export class SubElem extends LitElement {
    static styles = css`
    .selectMeToo {
        color: blue;
    }`

    render() {
        return html`<div>
            <p class="selectMe">I am within another shadow root element</p>
            <p class="selectMeToo">I am within another shadow root element as well</p>
        </div>`
    }
}

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
    #serverResponse?: string

    // Define scoped styles right with your component, in plain CSS
    static styles = css`
    :host {
        color: blue;
    }`

    // Declare reactive properties
    @property()
    // eslint-disable-next-line indent
    name?: string = 'World'

    // Render the UI as a function of component state
    render() {
        return html`<div>
            <p>${GREETING}, ${this.name}! ${this.getQuestion()}</p>
            <button @click="${() => this.#handleClick(0)}">Good</button>
            <hr />
            <em>${this.#serverResponse}</em>
            <sub-elem></sub-elem>
        </div>`
    }

    getQuestion() {
        return 'How are you today?'
    }

    async #handleClick (answer: number) {
        const mutation = gql`
            mutation AddMood($mood: Number!) {
                insert_mood_one(object: { mood: $mood }) {
                    mood
                }
            }
        `

        const data: any = await graphQLClient.request(mutation, { mood: answer })
            .catch(/* istanbul ignore next */ () => ({ result: 'Error: failed to make request' }))
        this.#serverResponse = data.result
        this.requestUpdate()
    }
}
