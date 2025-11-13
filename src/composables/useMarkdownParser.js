const INLINE_CODE_REGEX = /`([^`]+)`/g

const parseInlineCode = (text) => {
    let lastIndex = 0
    const inlineParts = []
    let match

    const paragraphs = text.split(/\r?\n\s*\r?\n/g)

    paragraphs.forEach((paragraph, pIndex) => {
        if (paragraph.trim().length === 0) return

        lastIndex = 0
        const paragraphParts = []

        while ((match = INLINE_CODE_REGEX.exec(paragraph)) !== null) {
            const [fullMatch, codeContent] = match
            const matchStart = match.index
            const textBefore = paragraph.substring(lastIndex, matchStart)

            if (textBefore.length > 0) {
                paragraphParts.push({ 
                    type: "text", 
                    content: textBefore 
                })
            }

            paragraphParts.push({ 
                type: "inline-code", 
                language: "plaintext", 
                content: codeContent.trim() 
            })

            lastIndex = matchStart + fullMatch.length
        }

        const textAfter = paragraph.substring(lastIndex)

        if (textAfter.length > 0) {
            paragraphParts.push({ 
                type: "text", 
                content: textAfter 
            })
        }

        if (paragraphParts.length > 0) {
            inlineParts.push({
                type: "paragraph",
                content: paragraphParts
            })
        } else if (paragraph.trim().length > 0) {
            inlineParts.push({
                type: "paragraph",
                content: [{ type: "text", content: paragraph.trim() }]
            })
        }
    })

    return inlineParts
}

const CODE_BLOCK_REGEX = /```([\w-]*)[^\n]*\r?\n([\s\S]*?)```/g 

export const useMarkdownParser = (body) => {
    let lastIndex = 0
    const rawParts = []
    let match

    while ((match = CODE_BLOCK_REGEX.exec(body)) !== null) {
        const [fullMatch, language, code] = match
        const matchStart = match.index

        const textBefore = body.substring(lastIndex, matchStart)

        rawParts.push({ type: "raw-text", content: textBefore })

        rawParts.push({
            type: "code",
            language: language || "plaintext",
            content: code.trim()
        })

        lastIndex = matchStart + fullMatch.length
    }

    const textAfter = body.substring(lastIndex)
    rawParts.push({ type: "raw-text", content: textAfter })

    const finalParts = []

    for (const part of rawParts) {
        if (part.type === "raw-text") {
            const parsedInline = parseInlineCode(part.content)
            finalParts.push(...parsedInline)
        } else {
            finalParts.push(part)
        }
    }

    return finalParts.filter(p => p.content && p.content.length > 0);
}
