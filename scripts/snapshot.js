import { existsSync, writeFileSync } from 'node:fs'

const token = process.env.BROWSER_RUN_TOKEN
const id = process.env.BROWSER_RUN_ACCOUNT_ID

const target = 'src/project-entries/cathan-dev-snapshot.png'

async function takeShot() {
    if (!token || !id) {
        return null
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${id}/browser-run/screenshot`

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: 'https://cathan.dev/',
                viewport: {
                    width: 1200,
                    height: 800,
                    deviceScaleFactor: 2,
                    hasTouch: false,
                    isMobile: false
                },
                gotoOptions: {
                    waitUntil: 'networkidle0',
                    timeout: 20000
                },
                waitForSelector: {
                    selector: '.nav-terminal',
                    visible: true, timeout: 10000
                },
                screenshotOptions: { type: 'png' }
            }),
            signal: AbortSignal.timeout(60_000)
        })
        if (!res.ok) {
            console.log('snapshot: cloudflare said', res.status, await res.text())
            return null
        }
        const image = Buffer.from(await res.arrayBuffer())
        const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        if (!image.subarray(0, 8).equals(signature)) {
            console.log('snapshot: not a png')
            return null
        }
        if (image.readUInt32BE(16) !== 2400 || image.readUInt32BE(20) !== 1600) {
            console.log('snapshot: wrong size')
            return null
        }
        if (image.subarray(-8, -4).toString('latin1') !== "IEND") {
            console.log('snapshot: incomplete')
            return null
        }
        return image
    } catch (err) {
        console.log(err.message)
    }
    return null
}

const png = await takeShot()

if (png === null) {
    console.log('snapshot: keep old')
} else if (!existsSync(target)) {
    console.log('snapshot: old file missing')
} else {
    try {
        writeFileSync(target, png)
        console.log('snapshot: refreshed')
    } catch (err) {
        console.log(err.message)
    }
}
