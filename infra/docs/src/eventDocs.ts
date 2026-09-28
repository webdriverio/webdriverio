import fs from 'node:fs/promises'
import path from 'node:path'
import { getRootDir } from '@wdio/repo-utils'

export interface Event {
    id: string
    time: string
    title: string
    image: string
    description: string
    signup: boolean
}

export interface EventDocsOptions {
    rootDir?: string
    fetchImpl?: typeof fetch
}

export function renderEventPage(event: Event) {
    const date = new Date(event.time)
    return `---
id: "${event.id}"
title: "${event.title}"
custom_edit_url: https://github.com/webdriverio/events/edit/main/events/${event.id}.md
---

![${event.title}](https://events.webdriver.io/${event.image})

<EventDetails event={${JSON.stringify(event)}}></EventDetails>
<br />
<br />
${event.description}

${event.signup ? `<EventSignup id="${event.id}" date="${date.toString()}" />` : ''}

[Back to Events](/community/events)
`
}

export function upcomingEventIds(events: Event[], now = new Date()) {
    return events
        .filter((event) => new Date(event.time) > now)
        .map((event) => event.id)
}

export async function generateEventDocs (options: EventDocsOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const fetchImpl = options.fetchImpl ?? fetch
    const eventsDir = path.resolve(rootDir, 'website', 'community', 'events')
    const sidebarPath = path.join(rootDir, 'website', 'events.json')
    await fs.mkdir(eventsDir, { recursive: true })
    await fs.writeFile(sidebarPath, JSON.stringify([]), 'utf-8')

    let events

    try {
        const res = await fetchImpl('https://events.webdriver.io/api/events')
        events = await res.json() as Event[]
    } catch (err) {
        console.error(`ERROR: Failed fetching events from [https://events.webdriver.io/api/events]: ${(err as Error).message}`)
        return
    }

    const sidebarContent = upcomingEventIds(events)

    await fs.writeFile(
        sidebarPath,
        JSON.stringify(sidebarContent),
        'utf-8'
    )

    return Promise.all(events.map(async (event) => {
        console.log(`Generate Event Docs for ${event.id}`)
        const newDocsPath = path.join(eventsDir, `${event.id}.md`)
        return fs.writeFile(newDocsPath, renderEventPage(event))
    }))
}
