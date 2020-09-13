
import { getBrowserObject } from '../../utils'

export default function parentElement () {
    return getBrowserObject(this.$(function () { return this.parentElement }))
}