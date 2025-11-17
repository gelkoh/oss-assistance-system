<template>
    <div class="flex justify-center items-center flex-col mt-40">
        <h1 class="text-2xl text-white">Open source assistance system</h1>

        <div class="text-6xl text-center font-bold text-white">
            <h2 class="mt-2">
                Open a code repository<br /> to get started
            </h2>
        </div>

        <div class="flex gap-x-12 mt-20 max-w-[1000px] w-full">
            <RecentlyUsedRepositories class="grow" />
            <GetStarted
                @show-clone-repository-popup="isCloneRepositoryPopupVisible = true"
            />
        </div>

        <CloneRepositoryPopup
            v-if="isCloneRepositoryPopupVisible"
            @hide-clone-repository-popup="isCloneRepositoryPopupVisible = false"
        />
    </div>
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import RecentlyUsedRepositories from "../components/RecentlyUsedRepositories.vue"
    import GetStarted from "../components/GetStarted.vue"
    import CloneRepositoryPopup from "../components/CloneRepositoryPopup.vue"
    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()

    const isLoading = ref(false)

    const isCloneRepositoryPopupVisible = ref(false)

    onMounted(() => {
        if (typeof window.api === "undefined")  {
            console.error("window.api is not available")
            return
        }

        window.api.onDirectorySelectionCanceled(() => {
            isLoading.value = false
        })

        window.api.onSelectedDirectory((path) => {
            isLoading.value = true
            repoStore.readRepoContents(path)
        })
    })
</script>
