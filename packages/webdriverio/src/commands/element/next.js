
import { getBrowserObject } from '../../utils'

export default function next () {
    return getBrowserObject(this.$(function () { return this.nextElementSibling }))
}