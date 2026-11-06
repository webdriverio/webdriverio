import { MARKER } from './SideEffectValue.js'

globalThis.sideEffectOrder.push(`named:${MARKER}`)
export const marker = MARKER
