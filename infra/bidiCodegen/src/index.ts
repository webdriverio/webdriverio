import { generateBidiTypes } from './generate.js'

const generated = await generateBidiTypes()
if (!generated) {
    process.exit(0)
}
