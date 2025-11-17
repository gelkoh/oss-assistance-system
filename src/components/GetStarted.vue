<template>
    <div>
        <div class="text-2xl font-bold">Get Started</div>

        <div class="flex flex-col gap-3">
            <button
                @click="openRepo"
                :disabled="repoStore.isLoading"
                class="cursor-pointer mt-5 bg-orange-500 hover:bg-orange-600
                       px-4 py-2 rounded-sm"
            >
                Open Local Repository
            </button>

            <button
                @click="$emit('show-clone-repository-popup')"
                class="cursor-pointer bg-orange-500 hover:bg-orange-600 px-4
                py-2 rounded-sm"
            >
                Clone A Repository
            </button>
        </div>
    </div>
</template>

<script setup>
    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()

    const openRepo = () => {
        window.api.openDirectoryDialog()
    }
</script>
