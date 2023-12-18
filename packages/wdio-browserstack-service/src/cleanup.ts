import { stopBuildUpstream } from './util'

export default class BStackCleanup {
    static startCleanup() {
        try {
            this.executeObservabilityCleanup()
        } catch (err) {
            const error = err as string
            console.error(error)
        }
    }
    static executeObservabilityCleanup() {
        if (!process.env.BS_TESTOPS_JWT) {
            return
        }
        console.log('Executing observability cleanup')
        stopBuildUpstream().then(() => {
            if (process.env.BS_TESTOPS_BUILD_HASHED_ID) {
                console.log(`\nVisit https://observability.browserstack.com/builds/${process.env.BS_TESTOPS_BUILD_HASHED_ID} to view build report, insights, and many more debugging information all at one place!\n`)
            }
        }).catch((err: any) => {
            console.error(err)
        })
    }
}

BStackCleanup.startCleanup()
