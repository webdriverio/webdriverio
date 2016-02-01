/**
 * check if selenium response contains an element result
 * @param  {object}  result response object from the driver
 * @return {Boolean}        returns
 *         						0 if response was not an element result
 *         						1 if response was a element result
 *         						2 if response was an elements result
 */
function hasElementResult (result) {
    /**
     * check for element call
     */
    if (result && result.value && result.value.ELEMENT) {
        return 1
    }
    /**
     * check for elements call
     */
    if (result && Array.isArray(result.value) && result.value.filter((r) => !r.ELEMENT).length === 0) {
        return 2
    }

    return 0
}

export default hasElementResult
