import React, { useState, useEffect } from 'react'

function filterEvent (past = false) {
    return (event) => {
        const date = new Date(event.date.replace('00:00:00', event.time, { timeZone: 'UTC' }))
        return past ? date < new Date() : date > new Date()
    }
}

export function EventList() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (events.length > 0) {
            return
        }
        fetch('https://events.webdriver.io/api/events').then(async (res) => {
            const events = await res.json()
            console.log(events)
            setEvents(events)
        }).catch((err) => {
            console.log(err)
        }).finally(() => {
            setLoading(false)
        })
    }, [])

    if (loading) {
        return <p>Loading...</p>
    }

    const upcomingEvents = events.filter(filterEvent())
    const pastEvents = events.filter(filterEvent(true))
    return (
        <div>
            <h2>Upcoming Events</h2>
            {events.length === 0 && <p><i>No upcoming events</i></p>}
            {upcomingEvents.map((event) => {
                const date = new Date(event.date.replace('00:00:00', event.time, { timeZone: 'UTC' }))
                return (
                    <div key={event.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        marginBottom: 20
                    }}>
                        <a href={`/community/events/${event.id}`}>
                            <img width={300} src={`https://events.webdriver.io${event.image}`}></img>
                        </a>
                        <div>
                            <h3><a href={`/community/events/${event.id}`}>{event.title}</a></h3>
                            <p>
                                📅 <b>Date:</b> {date.toDateString()} <br/>
                                ⏰ <b>Time:</b> {date.toLocaleTimeString()} <br/>
                                📍 <b>Location:</b> {event.location} (<a href={`https://www.google.com/maps/search/${encodeURIComponent(event.location)}`}>Google Maps</a>)
                            </p>
                        </div>
                    </div>
                )
            })}

            <h2>Past Events</h2>
            {pastEvents.length === 0 && <p><i>No past events!</i></p>}
            {pastEvents.map((event) => {
                const date = new Date(event.date.replace('00:00:00', event.time, { timeZone: 'UTC' }))
                return (
                    <a key={event.id} href={`/community/events/${event.id}`} style={{ display: 'block' }}>
                        {event.title} - {date.toDateString()}
                    </a>
                )
            })}
            <br />
        </div>
    )
}

export function EventSignup ({ id, date }) {
    const inputStyles: React.CSSProperties = {
        padding: 10,
        marginBottom: 10,
        width: '50%',
        borderRadius: 3,
    }
    const buttonStyles: React.CSSProperties = {
        padding: 10,
        borderRadius: 3,
        backgroundColor: 'var(--ifm-color-primary)',
        color: 'white',
        border: 'none',
        fontWeight: 'bold',
    }
    const now = new Date()
    if (now > new Date(date)) {
        return
    }

    return (
        <>
            <h2>Sign up</h2>
            <p>
                We would love to see you at the event. Please make sure to rsvp to secure your spot.
            </p>
            <form action={`https://events.webdriver.io/api/signup/${id}`} method="POST">
                <input type="text" name="name" placeholder="Your name" required style={inputStyles}></input>
                <br />
                <input type="email" name="email" placeholder="Your email" required style={inputStyles}></input>
                <br />
                <button type="submit" style={buttonStyles}>Sign up</button>
            </form>
            <br />
        </>
    )
}
