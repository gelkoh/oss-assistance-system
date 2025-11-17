<template>
    <HomeView v-if="!repoStore.isRepoOpen" />
    <RepoView v-else />
</template>

<script setup>
    import HomeView from "./components/HomeView.vue"
    import RepoView from "./components/RepoView.vue"
    import { useRepoStateStore } from "./stores/repoState.js"

    const repoStore = useRepoStateStore()
</script>
