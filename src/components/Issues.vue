<template>
    <div v-if="Object.keys(repoStore.currentlyViewedIssue).length === 0" class="flex flex-col h-full overflow-hidden">
        <div class="overflow-y-auto grow">
            <div class="text-lg font-bold">There are {{ repoStore.issues.length }} open issues. Target an issue to pass it as context to the chatbot.</div>

            <Issue
                v-if="repoStore.issues.length > 0"
                v-for="(issue, index) in repoStore.issues"
                :issue 
                :key="index"
            />
        </div>
    </div>

    <IssueDetails v-else />
</template>

<script setup>
    import { ref } from "vue"
    import { Circle, CircleDot, Target } from "lucide-vue-next"
    import Issue from "../components/Issue.vue"
    import IssueDetails from "../components/IssueDetails.vue"

    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()
</script>
