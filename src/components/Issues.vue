<template>
    <div>
        <div class="w-120 h-240 bg-neutral-800 absolute top-6 left-24 rounded-md border border-neutral-500 p-4">
            <div v-if="issuesListVisible">
                <div class="text-xl">
                    Issues
                </div>

                <div>
                    <div class="text-lg">{{ issues.length }} open issues</div>

                    <div v-if="issues.length > 0" v-for="issue in issues" class="mt-2 p-1 bg-neutral-700 rounded-sm">
                        <div @click="viewIssue(issue)" class="text-blue-500 text-lg cursor-pointer inline-block">{{ issue.title }}</div>
                        <div>#{{ issue.number }} by {{ issue.user.login }}</div>
                    </div>
                </div>

                <button @click="$emit('load-repo-issues')" class="px-3 py-1 bg-blue-600 rounded-sm hover:bg-blue-500 mt-4">
                    Fetch issues
                </button>
            </div>

            <div v-else class="relative overflow-y-auto max-h-full">
                <IssueDetails :selectedIssue :parsedIssueBody @go-back-to-issues-list="handleGoBackToIssuesList" />
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import { CircleDot } from "lucide-vue-next"
    import IssueDetails from "../components/IssueDetails.vue"

    const issuesListVisible = ref(true)
    const selectedIssue = ref({})
    const parsedIssueBody = ref({})

    const props = defineProps({
        issues: Array,
        ownerName: String,
        repoName: String
    })

    const parseIssueBody = (body) => {
        const CODE_BLOCK_REGEX = /```([\w-]*)[^\n]*\r?\n([\s\S]*?)```/g

        let lastIndex = 0
        const parts = []
        let match

        while ((match = CODE_BLOCK_REGEX.exec(body)) !== null) {
            const [fullMatch, language, code] = match
            const matchStart = match.index

            const textBefore = body.substring(lastIndex, matchStart).trim()

            if (textBefore.length > 0) {
                parts.push({ type: "text", content: textBefore })
            }

            parts.push({
                type: "code",
                language: language || "plaintext",
                content: code.trim()
            })

            lastIndex = matchStart + fullMatch.length
        }

        const textAfter = body.substring(lastIndex).trim()

        if (textAfter.length > 0) {
            parts.push({ type: "text", content: textAfter })
        }

        return parts
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
