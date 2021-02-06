import Table from 'easy-table'
import * as Crypto from 'crypto'

const SEPARATOR = '│'

/**
 * transform cucumber table to format suitable for `easy-table`
 * @param   {object[]} rows cucumber table rows
 * @returns {object[]}
 */
export const buildTableData = (rows) => rows.map(row => {
    const tableRow = {};
    [...row.cells, ''].forEach((cell, idx) => {
        tableRow[idx] = (idx === 0 ? `${SEPARATOR} ` : '') + cell
    })
    return tableRow
})

/**
 * returns table in string format
 * @param   {object[]} data table data
 * @returns {string}
 */
export const printTable = (data) => Table.print(data, null, (table) => {
    table.separator = ` ${SEPARATOR} `
    return table.print()
})

/**
 * add indentation
 * @param {string} table printed table
 * @param {string} testIndent whitespaces
 */
export const getFormattedRows = (table, testIndent) =>
    table.split('\n').filter(Boolean).map((line) => `${testIndent}  ${line}`.trimRight())

/**
 * Get Sauce Labs Authentication url
 * @param user
 * @param key
 * @param sessionId
 * @returns {string}
 */
export const sauceAuthenticationToken = ({ user, key, sessionId }) => {
    const secret = `${user}:${key}`

    // Create the token
    const token = Crypto
        // Calling createHmac method
        .createHmac('md5', secret)
        // Update data
        .update(sessionId)
        // Encoding to be used
        .digest('hex')

    return `?auth=${token}`
}
