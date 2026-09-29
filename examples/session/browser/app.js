/**
 * The postcard follows the browser, not the buttons.
 * `geolocation` chooses the city, `emulate color-scheme` turns the lamps
 * off, `emulate clock` moves the sky, and `mock` decides the weather.
 */

const CITIES = [
    { name: 'Tokyo', stamp: 'TOKYO', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
    { name: 'Reykjavík', stamp: 'REYKJAVÍK', lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik' },
    { name: 'Cairo', stamp: 'CAIRO', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
    { name: 'New York', stamp: 'NEW YORK', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
    { name: 'Sydney', stamp: 'SYDNEY', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' }
]

const card = document.querySelector('#card')
const clock = document.querySelector('#clock')
const place = document.querySelector('#place')
const stamp = document.querySelector('#stamp')
const seal = document.querySelector('#seal')
const written = document.querySelector('#written')
const note = document.querySelector('#note')
const status = document.querySelector('#status')
const lamps = document.querySelector('#lamps')

const state = {
    city: /** @type {typeof CITIES[number] | null} */ (null),
    weather: 'clear',
    sent: false,
    note: '',
    error: ''
}

function haversine (aLat, aLon, bLat, bLon) {
    const rad = Math.PI / 180
    const dLat = (bLat - aLat) * rad
    const dLon = (bLon - aLon) * rad
    const h = Math.sin(dLat / 2) ** 2
        + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2
    return 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

function nearest (lat, lon) {
    let best = CITIES[0]
    let bestDistance = Infinity
    for (const city of CITIES) {
        const distance = haversine(lat, lon, city.lat, city.lon)
        if (distance < bestDistance) {
            best = city
            bestDistance = distance
        }
    }
    return best
}

function timeIn (date, tz) {
    const list = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(date)
    const hour = Number(list.find((part) => part.type === 'hour')?.value || '0') % 24
    const minute = list.find((part) => part.type === 'minute')?.value || '00'
    return { hour, minute }
}

function phaseOf (hour) {
    if (hour >= 21 || hour < 5) {
        return 'night'
    }
    if (hour < 8 || hour >= 17) {
        return 'dusk'
    }
    return 'day'
}

function render () {
    const tz = state.city?.tz || 'UTC'
    const time = timeIn(new Date(), tz)
    const phase = state.city ? phaseOf(time.hour) : 'day'
    card.dataset.phase = phase
    card.dataset.weather = state.weather
    card.dataset.sent = String(state.sent)
    const hh = String(time.hour).padStart(2, '0')
    clock.hidden = !state.city
    clock.textContent = state.city ? `${state.city.name} ${hh}:${time.minute}` : ''
    place.textContent = state.city ? state.city.name : 'Somewhere unnamed'
    stamp.hidden = !state.city
    if (state.city) {
        stamp.textContent = state.city.stamp
    }
    seal.hidden = !state.sent
    written.hidden = !state.sent
    if (state.sent) {
        written.textContent = state.note
        note.disabled = true
    }
    lamps.textContent = matchMedia('(prefers-color-scheme: dark)').matches
        ? 'The lamps are off.'
        : 'The lamps are on.'
    if (state.error) {
        status.textContent = state.error
    } else if (state.sent) {
        status.textContent = 'Sent.'
    } else if (state.weather === 'snow' && state.city) {
        status.textContent = `Snow over ${state.city.name}.`
    } else if (state.weather === 'aurora' && state.city) {
        status.textContent = `Aurora over ${state.city.name}.`
    } else if (state.city) {
        status.textContent = `Stamped in ${state.city.name}.`
    } else {
        status.textContent = 'A blank card.'
    }
}

document.querySelector('#stamp-btn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition((position) => {
        state.error = ''
        state.city = nearest(position.coords.latitude, position.coords.longitude)
        render()
    }, () => {
        state.error = 'The browser did not share a location.'
        render()
    })
})

document.querySelector('#sky-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/weather')
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }
        const body = await response.json()
        state.error = ''
        state.weather = body.condition === 'snow' || body.condition === 'aurora' ? body.condition : 'clear'
        render()
    } catch (error) {
        state.error = `The sky did not answer. ${error instanceof Error ? error.message : 'fetch failed'}`
        render()
    }
})

document.querySelector('#send-btn').addEventListener('click', () => {
    const value = note.value.trim()
    if (!value) {
        state.error = 'Write a message first.'
        render()
        return
    }
    state.error = ''
    state.note = value
    state.sent = true
    render()
})

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render)

function frame () {
    render()
    if (!card.classList.contains('live')) {
        card.classList.add('live')
    }
    requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
