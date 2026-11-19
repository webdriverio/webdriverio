import { MARKER } from './SideEffectValue.js'
const captured = MARKER
export class RegisteredElement extends HTMLElement {
    connectedCallback() { this.textContent = captured }
}
customElements.define('wdio-side-effect-bare', RegisteredElement)
