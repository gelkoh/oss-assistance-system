<template>
    <div v-if="Object.keys(repoStore.selectedIssue).length === 0" class="flex flex-col h-full overflow-hidden">
        <div class="overflow-y-auto grow">
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
            class="cursor-pointer px-4 py-2 bg-blue-600 rounded-sm hover:bg-blue-500 mt-6 self-start"
        >
            Fetch issues
        </button>
    </div>

    <IssueDetails
        v-else
        @target-issue="$emit('target-issue', $event)"
    />
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import { Circle, CircleDot, Target } from "lucide-vue-next"
    import IssueDetails from "../components/IssueDetails.vue"
    import Issue from "../components/Issue.vue"
    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()

    const props = defineProps({
        issues: Array,
        ownerName: String,
        repoName: String
    })

    const viewIssue = (issue) => {
        repoStore.selectedIssue = issue
    }

    /*const handleGoBackToIssuesList = () => {
        issuesListVisible.value = true
        selectedIssue.value = {}
    }*/
</script>
