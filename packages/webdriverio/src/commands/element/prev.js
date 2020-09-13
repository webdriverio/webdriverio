
import { getBrowserObject } from '../../utils'

export default function prev () {
    return getBrowserObject(this.$(function () { return this.previousElementSibling }))
}