/**
 * BLM banner close button
 */
const blmBanner = document.querySelector('.blacklivesmatter')
const blmClose = blmBanner.querySelector('.close')
const navPusher = document.querySelector('.navPusher')
const fixedHeader = document.querySelector('.fixedHeaderContainer')

function show () {
    blmBanner.style.display = 'block'
    fixedHeader.style.top = '130px'
    navPusher.style.paddingTop = '180px'
}

function close () {
    window.localStorage.setItem('showBanner', false)
    blmBanner.style.display = 'none'
    fixedHeader.style.top = '0px'
    navPusher.style.paddingTop = '50px'
}

const showBanner = window.localStorage.getItem('showBanner')
if (!showBanner) {
    show()
    blmClose.addEventListener('click', close)
}
