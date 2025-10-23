<template>
    <h1>Hello World!</h1>
    <button @click="openRepo" :disabled="isLoading">Open Repository</button>
</template>

<script setup>
    import { ref, onMounted } from "vue"

    const isLoading = ref(false);
    const error = ref(null);
    const repoPath = ref("");
    const fileList = ref([]);

    onMounted(() => {
        if (typeof window.api === "undefined")  {
            error.value = "window.api is not available"
            console.log(error.value)
            return
        }

        window.api.onDirectorySelectionCanceled(() => {
            isLoading.value = false
            error.value = "Selection canceled"
            console.log(error.value)
        })

        window.api.onSelectedDirectory((path) => {
            repoPath.value = path
            error.value = null
            console.log(repoPath.value)
            window.api.readDirectoryContent(repoPath.value)
        })

        window.api.onDirectoryContentReady((list) => {
            isLoading.value = false
            error.value = null
            console.log(list)
        })

        window.api.onDirectoryContentError((err) => {
            isLoading.value = false
            error.value = `File access error: ${err}`
            fileList.value = []
        })
    })

    const openRepo = () => {
        isLoading.value = true
        error.value = null
        window.api.openDirectoryDialog()
    }
</script>
