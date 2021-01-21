import Table from 'easy-table'

const SEPARATOR = '│'

/**
 * transform cucumber table to format suitable for `easy-table`
 * @param   {object[]} rows cucumber table rows
 * @returns {object[]}
 */
export const buildTableData = (rows: any) => rows.map((row: any) => {
    const tableRow: Record<number, string> = {};
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
export const printTable = (data: any) => Table.print(data, undefined, (table) => {
    table.separator = ` ${SEPARATOR} `
    return table.print()
})

/**
 * add indentation
 * @param {string} table printed table
 * @param {string} testIndent whitespaces
 */
export const getFormattedRows = (table: string, testIndent: string) =>
    table.split('\n').filter(Boolean).map((line) => `${testIndent}  ${line}`.trimRight())
