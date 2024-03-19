import React, { useState, useEffect } from 'react'

function filterEvent (past = false) {
    return (event) => {
        const date = new Date(event.date.replace('00:00:00', event.time, { timeZone: 'UTC' }))
        return past ? date < new Date() : date > new Date()
    }
}

const EVENTS_URL = 'https://events.webdriver.io/api/events'

const profileStylesNoPhoto: React.CSSProperties = {
    width: '30px',
    transform: 'translateY(10px)',
    marginRight: '5px'
}

const profileStyles: React.CSSProperties = {
    ...profileStylesNoPhoto,
    borderRadius: '50%',
    border: '1px solid #EA5907',
}

const profileLinkStyles: React.CSSProperties = {
    backgroundColor: 'transparent',
    borderBottom: 'none',
    paddingRight: '15px',
}

export function Host ({ name, photo, social }) {
    return (
        <a href={social} style={profileLinkStyles}>
            <img src={photo || 'https://events.webdriver.io/webdriverio.png'} style={photo ? profileStyles : profileStylesNoPhoto} />
            {name}
        </a>
    )
}

function getEventDate (event: any) {
    return new Date(event.date.replace('00:00:00', event.time, { timeZone: 'UTC' }))
}

export function EventDetails ({ event: eventInput }: any) {
    /**
     * re-fetch event data to get the latest sign-ups
     */
    const [event, setEvent] = useState(eventInput)
    useEffect(() => {
        /**
         * except the event has no signup, we don't need to re-fetch the data
         */
        if (!eventInput.signup) {
            return
        }

        fetch(EVENTS_URL).then(async (res) => {
            const events = await res.json()
            setEvent(events.find((e) => e.id === eventInput.id))
        }).catch((err) => {
            console.log(err)
        })
    }, [])

    /**
     * only show attendee list if event has a signup
     */
    const attendeeList = event.signup
        ? <>👥 <b>Attendees:</b> {event.signups} ({event.maxattendees - event.signups} spots left)<br/></>
        : <></>

    const dateMerged = getEventDate(event)
    return (
        <>
            📅 <b>Date:</b> {dateMerged.toDateString()}<br/>
            ⏰ <b>Time:</b> {dateMerged.toLocaleTimeString()} <span style={{ fontSize: '.6em' }}>{new Date().toTimeString().slice(9)}</span><br/>
            📍 <b>Location:</b> {event.location} (<a href={`https://www.google.com/maps/search/${encodeURIComponent(event.location)}`}>Google Maps</a>)<br/>
            {attendeeList}
            🎤 <b>Hosts:</b> {JSON.parse(event.hosts).map((host, i) => (
                <Host key={i} name={host.name} social={host.social} photo={host.photo}></Host>
            ))}
        </>
    )
}

export function EventList() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (events.length > 0) {
            return
        }
        fetch(EVENTS_URL).then(async (res) => {
            const events = await res.json()
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
            {upcomingEvents.map((event) => (
                <div key={event.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    marginBottom: 20
                }}>
                    <a href={`/community/events/${event.id}`} style={{ minWidth: '300px' }}>
                        <img width={300} src={`https://events.webdriver.io${event.image}`}></img>
                    </a>
                    <div>
                        <h3>
                            <a href={`/community/events/${event.id}`}>{event.title}</a>
                        </h3>
                        <p>
                            <EventDetails event={{ ...event }}></EventDetails>
                        </p>
                    </div>
                </div>
            ))}

            <h2>Past Events</h2>
            {pastEvents.length === 0 && <p><i>No past events!</i></p>}
            {pastEvents.map((event) => {
                const date = getEventDate(event)
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
        cursor: 'pointer'
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
            <form action="https://events.webdriver.io/api/signup" method="POST" target="_blank">
                <input type="hidden" name="event" value={id}></input>
                <input type="text" name="name" placeholder="Your name" required style={inputStyles}></input>
                <br />
                <input type="email" name="email" placeholder="Your email*" required style={inputStyles}></input>
                <br />
                <button type="submit" style={buttonStyles}>Sign up</button>
            </form>
            <p style={{ fontSize: '.6em', width: '500px', padding: '10px 0' }}>
                * We will store your email only for the purpose of communicating with you
                in case we need to send information on the event, e.g. eventual cancellations
                or instruction on how to enter the venue. All data will be removed after the
                event.
            </p>
        </>
    )
}
