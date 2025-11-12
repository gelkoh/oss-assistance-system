<template>
    <div v-if="issuesListVisible">
        <div>
            <div class="text-lg font-bold">There are {{ issues.length }} open issues. Target an issue to pass it as context to the chatbot.</div>

            <Issue
                v-if="issues.length > 0"
                v-for="(issue, index) in issues"
                :issue :key="index"
                @view-issue="viewIssue"
                @target-issue="$emit('target-issue', $event)"
            />
        </div>

        <button
            @click="$emit('load-repo-issues')"
            class="cursor-pointer px-4 py-2 bg-blue-600 rounded-sm hover:bg-blue-500 mt-6"
        >
            Fetch issues
        </button>
    </div>

    <div v-else class="relative overflow-y-auto max-h-full">
        <IssueDetails
            :selectedIssue
            :parsedIssueBody
            @target-issue="$emit('target-issue', $event)"
            @go-back-to-issues-list="handleGoBackToIssuesList"
        />
    </div>
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import { Circle, CircleDot, Target } from "lucide-vue-next"
    import IssueDetails from "../components/IssueDetails.vue"
    import Issue from "../components/Issue.vue"

    const issuesListVisible = ref(true)
    const selectedIssue = ref({})
    const parsedIssueBody = ref({})

    const props = defineProps({
        issues: Array,
        ownerName: String,
        repoName: String
    })

    const parseInlineCode = (text) => {
        const INLINE_CODE_REGEX = /`([^`]+)`/g
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


    const parseIssueBody = (body) => {
        const CODE_BLOCK_REGEX = /```([\w-]*)[^\n]*\r?\n([\s\S]*?)```/g 

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

    const viewIssue = (issue) => {
        selectedIssue.value = issue

        parsedIssueBody.value = parseIssueBody(selectedIssue.value.body)

        issuesListVisible.value = false
    }

    const handleGoBackToIssuesList = () => {
        issuesListVisible.value = true
        selectedIssue.value = {}
    }
</script>
