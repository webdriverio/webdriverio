(() => {
    const buttons = [...document.querySelectorAll('.logoNavigation button')]
    const pages = buttons.length - 1
    const wrapper = document.querySelector('#companyUsage .wrapper > div')
    const list = wrapper.querySelector('ul')
    const containerWidth = wrapper.offsetWidth
    const INTERVAL_LENGTH = 5000

    function animateTo (i) {
        const x = i * -containerWidth
        list.style.transform = `translate(${x}px, 0px)`
        buttons.forEach((btn, index) => (btn.className = index === i ? 'active' : ''))
    }

    let ticks = 0
    const nextPage = () => {
        const direction = Math.floor(ticks / pages) % 2
        animateTo(direction
            ? pages - (ticks % pages)
            : ticks % pages
        )
        ++ticks
    }
    let swapInterval = setInterval(nextPage, INTERVAL_LENGTH)

    buttons.forEach((buttonNode, i) => {
        buttonNode.addEventListener('click', () => {
            animateTo(i)
            clearInterval(swapInterval)
            swapInterval = setInterval(nextPage, INTERVAL_LENGTH)
        })
    })
})()
