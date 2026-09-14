import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    hostname: 'your_cloud_name.perfectomobile.com',
    path: '/nexperience/perfectomobile/wd/hub',
    port: 443,
    protocol: 'https',
    // ...
    capabilities: [{
    // ...
        securityToken: 'your security token'
    }],
})
