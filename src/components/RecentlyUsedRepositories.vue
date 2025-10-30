<template>
    <div>
        Recently used repositories

        <ul>
            <li v-for="path in paths" :key="path">
                <button @click="$emit('open-recent-repository', path)" class="bg-neutral-800 px-4 py-3 mt-2 rounded-sm w-full hover:bg-neutral-700">
                    {{ path }}
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup>
    import { ref, onMounted } from "vue"

    const paths = ref([])

    const getRecentlyUsedRepositories = async () => {
        try {
            const recentlyUsedRepositories = await window.api.getRecentlyUsedRepositories()
            return recentlyUsedRepositories
        } catch(err) {
            console.log(`Error getting recently used repositories ${err}`)
        }
    }

    onMounted(async () => {
        getRecentlyUsedRepositories().then((recentlyUsedRepositoriesPaths) => {
            paths.value = recentlyUsedRepositoriesPaths
        })
    })
</script>
