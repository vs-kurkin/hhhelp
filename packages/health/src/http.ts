/* eslint-disable unicorn/no-process-exit */
import http from 'node:http'

const url = process.argv[2] || 'http://localhost'

const options = { timeout: 2000 }

const request = http.get(url, options, response => {
    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
        process.exit(0)
    } else {
        process.exit(1)
    }
})

request.on('error', () => {
    process.exit(1)
})

request.end()
