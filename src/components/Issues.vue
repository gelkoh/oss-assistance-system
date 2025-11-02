<template>
    <div>
        <div v-if="issuesVisible" class="w-120 h-240 bg-neutral-800 absolute top-6 right-24 rounded-md border border-neutral-500 p-4">
            <div class="text-xl">
                Issues
            </div>

            <div>
                <div class="text-large">{{ issues.length }} open issues</div>

                <div v-if="issues.length > 0" v-for="issue in issues" class="mt-2 p-1 bg-neutral-700 rounded-sm">
                    <div class="text-blue-500 text-large">{{ issue.title }}</div>
                    #{{ issue.number }} by {{ issue.user.login }}
                </div>
            </div>

            <button @click="$emit('load-repo-issues')" class="px-3 py-1 bg-blue-600 rounded-sm hover:bg-blue-500 mt-4">
                Fetch issues
            </button>
        </div>

        <button class="flex items-center justify-center w-12 h-12 absolute top-24 right-6 bg-neutral-800 border border-neutral-500 rounded-md hover:bg-neutral-700" @click="issuesVisible = !issuesVisible">
            <CircleDot />
        </button>
    </div>
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import { CircleDot } from "lucide-vue-next"

    const issuesVisible = ref(false)

    const props = defineProps({
        issues: Array,
        ownerName: String,
        repoName: String
    })

    onMounted(() => {
        console.log("Issues: " + props.issues)
    })
</script>
