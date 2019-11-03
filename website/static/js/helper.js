/* eslint no-undef: 0 */
/* eslint no-unused-vars: 0 */

function getConfig() {
    return {
        'startOnLoad':true,
        // Enabling htmlLabels = true will add a large amount of padding to the rect.
        'flowchart': {
            'htmlLabels': false
        }
    }
}

function createGraphSVG(graphIdAttribute) {
    console.log(graphIdAttribute)
    let element = document.querySelector(`#${graphIdAttribute}`)
    const insertSvg = function(svgCode) {
        element.innerHTML = svgCode
        /*
        Manually add height and width to element. Without this code the flow chart will not render correctly in the browser.
        REF: https://github.com/knsv/mermaid/issues/374
        */
        const viewboxWidth = element.getAttribute('viewbox').split(' ')[2]
        const viewboxHeight = element.getAttribute('viewbox').split(' ')[3]
        element.firstChild.style.height = (parseInt(viewboxHeight) + 20) + 'px'
        element.firstChild.style.width= (parseInt(viewboxWidth) + 20) + 'px'
    }
    return insertSvg
}

function createFlowChart(graphText, graphIdAttribute = 'flowChartGraphDiv') {
    const config = getConfig()

    mermaid.mermaidAPI.initialize(config)
    /* If node is existing remove. Used in the screens where the graph is toggled. */
    try {
        document.querySelector(`svg#${graphIdAttribute}`).remove()
    } catch(e) {
        // Fall through, graph element is being rendered for the first time.
    }
    const insertSvg = createGraphSVG(graphIdAttribute)
    mermaid.mermaidAPI.render(graphIdAttribute, graphText, insertSvg)
}