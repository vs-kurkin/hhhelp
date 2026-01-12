export function escape(text?: string): string {
    if (!text) return ''

    // Simple regex to escape all special characters for Telegram MarkdownV2
    return text.replaceAll(/[_*[\]()~`>#+\-=|{}!.]/g, String.raw`\$&`)
}
