import { generateDocs } from './generateDocs.js'

try {
    await generateDocs()
} catch (err) {
    console.error(err)
    process.exit(1)
}
