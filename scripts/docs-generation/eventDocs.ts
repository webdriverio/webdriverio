import fs from 'node:fs/promises'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

function getEventDate (event: any) {
    return new Date(event.date.replace('00:00:00', event.time, { timeZone: 'UTC' }))
}

export async function generateEventDocs () {
    const eventsDir = path.resolve(__dirname, '..', '..', 'website', 'community', 'events')
    await fs.mkdir(eventsDir, { recursive: true })

    const res = await fetch('https://events.webdriver.io/api/events')
    const events = (await res.json()).filter((event: any) => getEventDate(event) > new Date())

    const sidebarPath = path.join(__dirname, '..', '..', 'website', 'events.json')
    const sidebarContent = events
        .filter((event: any) => getEventDate(event) > new Date())
        .map((event: any) => event.id)

    await fs.writeFile(
        sidebarPath,
        JSON.stringify(sidebarContent),
        'utf-8'
    )

    return Promise.all(events.map(async (event: any) => {
        console.log(`Generate Event Docs for ${event.id}`)
        const date = getEventDate(event)
        const hosts = JSON.parse(event.hosts).map((host: any) => `<Host name="${host.name}" social="${host.social}" photo="${host.photo}"></Host>`).join('')
        const content = `---
id: ${event.id}
title: ${event.title}
custom_edit_url: https://github.com/webdriverio/events/edit/main/events/${event.id}.md
---

![${event.title}](https://events.webdriver.io/${event.image})

📅 **Date:** ${date.toDateString()}<br/>
⏰ **Time:** ${date.toLocaleTimeString()}<br/>
📍 **Location:** ${event.location} ([Google Maps](https://www.google.com/maps/search/${encodeURIComponent(event.location)}))<br/>
🎤 **Hosts:** ${hosts}

${event.description}

${event.signup ? `<EventSignup id="${event.id}" date="${date.toString()}" />` : ''}

[Back to Events](/community/events)
`

        const newDocsPath = path.join(eventsDir, `${event.id}.md`)
        return fs.writeFile(newDocsPath, content)
    }))
}
