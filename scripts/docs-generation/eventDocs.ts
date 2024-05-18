import fs from 'node:fs/promises'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export async function generateEventDocs () {
    const eventsDir = path.resolve(__dirname, '..', '..', 'website', 'community', 'events')
    await fs.mkdir(eventsDir, { recursive: true })

    const res = await fetch('https://events.webdriver.io/api/events')
    const events = await res.json()

    const sidebarPath = path.join(__dirname, '..', '..', 'website', 'events.json')
    const sidebarContent = events
        .filter((event: any) => new Date(event.time) > new Date())
        .map((event: any) => event.id)

    await fs.writeFile(
        sidebarPath,
        JSON.stringify(sidebarContent),
        'utf-8'
    )

    return Promise.all(events.map(async (event: any) => {
        console.log(`Generate Event Docs for ${event.id}`)
        const date = new Date(event.time)
        const content = `---
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

        const newDocsPath = path.join(eventsDir, `${event.id}.md`)
        return fs.writeFile(newDocsPath, content)
    }))
}
