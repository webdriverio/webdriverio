#!/usr/bin/env node
import { backportPRs, maintenanceLTSVersion } from './backport.js'

backportPRs().then(
    (amount) => console.log(amount
        ? (
            `\nSuccessfully backported ${amount} PRs 👏!\n` +
            `Please now push them to v6 and make a new ${maintenanceLTSVersion}.x release!`
        )
        : 'Bye!'
    ),
    (err) => console.error(`Error backporting: ${err.stack}`)
)
