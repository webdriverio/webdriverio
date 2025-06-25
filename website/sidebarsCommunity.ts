import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

import events from './events.json' with { type: 'json' }

const sidebarsCommunity: SidebarsConfig = {
    community: [
        'support',
        {
            type: 'category',
            label: 'Events',
            link: {
                type: 'doc',
                id: 'events'
            },
            items: events.map((event: string) => `events/${event}`)
        },
        'openofficehours',
        'team',
        'resources',
        'materials',
        'donate'
    ]
}

export default sidebarsCommunity
