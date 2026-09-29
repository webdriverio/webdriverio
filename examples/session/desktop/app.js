/**
 * Arm the lamp, then press Space (or click Launch).
 * A second window opens with the altitude.
 */

const lamp = document.querySelector('#lamp')
const readout = document.querySelector('#readout')
const status = document.querySelector('#status')
const launch = document.querySelector('#launch')

let state = 'hold'

document.querySelector('#arm').addEventListener('click', () => {
    if (state !== 'hold') {
        return
    }
    state = 'armed'
    lamp.dataset.state = 'armed'
    readout.textContent = 'ARMED'
    launch.disabled = false
    status.textContent = 'Armed. Press Space to launch.'
})

function wait (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function liftoff () {
    if (state !== 'armed') {
        return
    }
    state = 'launching'
    lamp.dataset.state = 'launching'
    launch.disabled = true
    status.textContent = 'Launching.'
    for (const step of ['3', '2', '1', 'LIFTOFF']) {
        readout.textContent = step
        await wait(320)
    }
    state = 'launched'
    lamp.dataset.state = 'launched'
    status.textContent = 'Launched.'
    const opened = window.open('telemetry.html', 'telemetry', 'width=420,height=640')
    if (!opened) {
        status.textContent = 'Launched. The telemetry window was blocked.'
    }
}

document.querySelector('#launch').addEventListener('click', () => {
    liftoff()
})

window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') {
        return
    }
    event.preventDefault()
    liftoff()
})
