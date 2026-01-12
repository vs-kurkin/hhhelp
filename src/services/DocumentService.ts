import { config } from '#config'
import axios from 'axios'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { type TextItem } from 'pdfjs-dist/types/src/display/api.js'

export class DocumentService {
    async extractText(filePath: string, isPdf: boolean): Promise<string> {
        if (!filePath) return ''

        const fileUrl = `https://api.telegram.org/file/bot${ config.TELEGRAM_BOT_TOKEN_HH }/${ filePath }`
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' })

        let extractedText = ''

        if (isPdf) {
            const pdfBuffer = Buffer.from(response.data)
            const pdfDocument = await pdfjsLib.getDocument(new Uint8Array(pdfBuffer)).promise

            for (let index = 1; index <= pdfDocument.numPages; index++) {
                const page = await pdfDocument.getPage(index)
                const textContent = await page.getTextContent()

                extractedText += textContent.items.map(item => (item as TextItem).str).join(' ') + '\n'
            }
        } else {
            extractedText = Buffer.from(response.data).toString('utf8')
        }

        return extractedText.slice(0, 20_000)
    }
}
