<template>
    <div class="flex flex-col h-full overflow-hidden">
        <input
            v-model="searchQuery"
            @keyup="search"
            type="text"
            class="bg-neutral-700 px-2 py-1 rounded-sm mb-6 w-full border border-neutral-500" 
            placeholder="Find"
        />

        <ul class="overflow-y-auto grow">
            <li v-for="file in repoStore.currentFileTree.children">
                <FileTree
                    :searchQuery="searchQuery.trim()"
                    :file="file"
                    class="min-w-xs border-none pt-0!"
                />
            </li>
        </ul>

        <div v-if="searchQuery.trim().length !== 0 && anyMatch === false">No matching file found...</div>
    </div>
</template>

<script setup>
    import FileTree from "../components/FileTree.vue"
    import { ref, onMounted, onBeforeUnmount } from "vue"
    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()

    onMounted(() => {
        if (repoStore.currentSearchQuery != "") {
            searchQuery.value = repoStore.currentSearchQuery
            search()
        }
    })

    onBeforeUnmount(() => {
        repoStore.setSearchQuery(searchQuery.value)
    })

    const isRootDirectoryOpen = ref(true)

    const searchQuery = ref("")
    const anyMatch = ref(false)

    const searchNode = (node) => {
        let matches = false
        const lowerQuery = searchQuery.value.toLowerCase()

        if (node.type === "file") {
            if (node.name.toLowerCase().includes(lowerQuery)) {
                matches = true

                if (anyMatch.value === false) {
                    anyMatch.value = true
                }
            }

            node.fitsSearchQuery = matches
        }

        if (node.children) {
            node.children.forEach((child) => {
                const childMatches = searchNode(child)

                if (childMatches) {
                    matches = true

                    if (anyMatch.value === false) {
                        anyMatch.value = true
                    }
                }
            })
        }

        if (node.type === "directory") {
            node.fitsSearchQuery = matches
        }

        return matches
    }

    const search = () => {
        anyMatch.value = false
        searchNode(repoStore.currentFileTree.children[0])
    }
</script>
