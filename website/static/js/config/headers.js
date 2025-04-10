import { Buffer } from 'node:buffer'
import { defineConfig } from '@wdio/config'

// Read the username and password from environment variables
const username = process.env.SELENIUM_GRID_USERNAME
const password = process.env.SELENIUM_GRID_PASSWORD

// Combine the username and password with a colon separator
const credentials = `${username}:${password}`
// Encode the credentials using Base64
const encodedCredentials = Buffer.from(credentials).toString('base64')

export const config = defineConfig({
    // ...
    headers: {
        Authorization: `Basic ${encodedCredentials}`
    }
    // ...
})