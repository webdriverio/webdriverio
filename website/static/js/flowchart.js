/* eslint no-undef: 0 */
/* eslint no-unused-vars: 0 */

function getConfig() {
    return {
        startOnLoad: true,
        // Enabling htmlLabels = true will add a large amount of padding to the rect.
        flowchart: {
            htmlLabels: false,
        },
    }
}

function createFlowChart(graphText, graphIDAttribute = 'flowChartGraphDiv', graphContainerIdAttribute = 'flowChartGraphDivContainer') {
    const config = getConfig()
    mermaid.initialize(config)
    mermaid.render(graphIDAttribute, graphText, null, document.getElementById(graphContainerIdAttribute))
}
