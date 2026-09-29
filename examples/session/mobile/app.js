/**
 * A phone-sized boarding pass.
 * Board and flip are buttons, so a browser session can `click` them.
 * A finger swipe also flips the card. Turning the viewport sideways
 * (a device rotation, or `emulate viewport`) folds the pass into a stub.
 * `?flight=aurora` is the other flight.
 */

const FLIGHTS = {
    wd10: { from: 'Tokyo', to: 'Reykjavík', code: 'WD 10', seat: '4A', gate: '7' },
    aurora: { from: 'Reykjavík', to: 'Aurora', code: 'WD 01', seat: '1A', gate: 'North' }
}

const key = new URLSearchParams(location.search).get('flight') === 'aurora' ? 'aurora' : 'wd10'
const info = FLIGHTS[key]
const pass = document.querySelector('#pass')
const status = document.querySelector('#status')
const pose = document.querySelector('#pose')
const orient = document.querySelector('#orient')
const gate = document.querySelector('#gate')

document.body.dataset.flight = key
pass.dataset.flight = key
document.querySelector('#from').textContent = info.from
document.querySelector('#to').textContent = info.to
document.querySelector('#code').textContent = info.code
document.querySelector('#seat').textContent = info.seat
document.querySelector('#back-code').textContent = info.code

let boarded = false
let flipped = false

function render () {
    pass.dataset.boarded = String(boarded)
    pass.dataset.flipped = String(flipped)
    gate.textContent = boarded ? info.gate : '—'
    if (key === 'aurora') {
        status.textContent = 'Flight WD 01 to Aurora.'
    } else if (boarded) {
        status.textContent = 'Now boarding WD 10.'
    } else {
        status.textContent = 'Ready to board.'
    }
    pose.textContent = flipped ? 'The pass is flipped.' : 'The pass is face up.'
    orient.textContent = matchMedia('(orientation: landscape)').matches
        ? 'The pass is a stub.'
        : 'The pass is upright.'
}

document.querySelector('#board').addEventListener('click', () => {
    boarded = true
    render()
})

function flip () {
    flipped = !flipped
    render()
}

document.querySelector('#flip').addEventListener('click', flip)

let startX = /** @type {number | null} */ (null)
pass.addEventListener('pointerdown', (event) => {
    startX = event.clientX
    pass.setPointerCapture(event.pointerId)
})
pass.addEventListener('pointerup', (event) => {
    if (startX !== null && startX - event.clientX >= 48) {
        if (!flipped) {
            flip()
        }
    }
    startX = null
})

matchMedia('(orientation: landscape)').addEventListener('change', render)
window.addEventListener('resize', render)
render()
