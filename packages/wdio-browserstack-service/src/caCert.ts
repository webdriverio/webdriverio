import { setGlobalDispatcher, Agent } from 'undici'
import tls from 'node:tls'
import fs from 'node:fs'

import { BStackLogger } from './bstackLogger.js'

/*
 * SDK-5953: trust a customer-provided CA certificate for SSL-inspecting corporate
 * proxies (Zscaler, Netskope, Forcepoint).
 *
 * Resolution order for the cert path:
 *   1. env BROWSERSTACK_EXTRA_CA_CERTS   (consistency with the other SDKs)
 *   2. the `proxyCaCertificate` service option
 *
 * The service makes outbound HTTPS via undici `fetch`: most call sites use the
 * global fetch (covered by a global undici Agent), and the proxy path in
 * fetchWrapper uses a ProxyAgent (which needs the CA on `requestTls`). We build a
 * MERGED ca list (Node's default roots + the customer cert) so non-intercepted
 * endpoints still validate. Also export NODE_EXTRA_CA_CERTS for child processes.
 *
 * Never throws — a misconfigured cert must not break the customer's run.
 */

let mergedCa: string[] | undefined
let configured = false

function resolveCaCertPath(options?: { proxyCaCertificate?: string }): string | undefined {
    let p = process.env.BROWSERSTACK_EXTRA_CA_CERTS
    if ((!p || !p.trim()) && options?.proxyCaCertificate) {
        p = options.proxyCaCertificate
    }
    if (!p || !String(p).trim()) {
        return undefined
    }
    p = String(p).trim()
    try {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            return p
        }
        BStackLogger.warn(`proxyCaCertificate: path does not exist or is not a file, falling back to system trust store: ${p}`)
    } catch (e) {
        BStackLogger.warn(`proxyCaCertificate: failed to stat cert path ${p}: ${(e as Error).message}`)
    }
    return undefined
}

/** The merged CA list (system roots + customer cert), or undefined when not configured. */
export function getMergedCa(): string[] | undefined {
    return mergedCa
}

/** Idempotent. Sets a global undici dispatcher trusting the merged CA, and NODE_EXTRA_CA_CERTS. */
export function configureCaCertificate(options?: { proxyCaCertificate?: string }): void {
    if (configured) {
        return
    }
    try {
        const certPath = resolveCaCertPath(options)
        if (!certPath) {
            return
        }
        const caPem = fs.readFileSync(certPath, 'utf8')
        mergedCa = [...tls.rootCertificates, caPem]
        // Covers every global fetch() call in this process (undici-backed). Merge, not replace.
        setGlobalDispatcher(new Agent({ connect: { ca: mergedCa } }))
        // Child Node processes (e.g. the detached cleanup spawn) inherit and trust it at startup.
        if (!process.env.NODE_EXTRA_CA_CERTS) {
            process.env.NODE_EXTRA_CA_CERTS = certPath
        }
        configured = true
        BStackLogger.info(`proxyCaCertificate: trusting custom CA from ${certPath} (merged with system roots).`)
    } catch (e) {
        BStackLogger.warn(`proxyCaCertificate: setup failed, falling back to system trust store: ${(e as Error).message}`)
    }
}
