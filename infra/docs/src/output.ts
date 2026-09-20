import fs from 'node:fs'
import path from 'node:path'

export function print (title: string) {
    console.log(`
//////////////////////////////////////////////////
${title}
//////////////////////////////////////////////////`)
}

export function writeSidebars(sidebars: unknown, websiteDir: string) {
    fs.writeFileSync(
        path.join(websiteDir, 'sidebars.json'),
        JSON.stringify(sidebars, null, 2),
        { encoding: 'utf-8' }
    )
}
