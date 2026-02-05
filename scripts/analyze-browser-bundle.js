import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const browserBuild = readFileSync('./packages/webdriverio/build/browser.js')
const browserBuildMin = readFileSync('./packages/webdriverio/build/browser.min.js')

console.log('Browser Build Size Analysis:')
console.log('-----------------------------')
console.log(`Raw:            ${(browserBuild.length / 1024).toFixed(2)} KB`)
console.log(`Minified:       ${(browserBuildMin.length / 1024).toFixed(2)} KB`)
console.log(`Gzipped:        ${(gzipSync(browserBuildMin).length / 1024).toFixed(2)} KB`)

const code = browserBuild.toString()
const issues = []

if (code.includes('require(\"fs\")') || code.includes('node:fs')) issues.push('Found fs require')
if (code.includes('require(\"child_process\")') || code.includes('node:child_process')) issues.push('Found child_process require')
if (code.includes('process.exit')) issues.push('Found process.exit call')
if (code.includes('require(\"net\")') || code.includes('node:net')) issues.push('Found net require')

if (issues.length > 0) {
    console.log('\nPotential Issues:')
    issues.forEach(issue => console.log(`  ${issue}`))
} else {
    console.log('\nNo obvious issues detected')
}
