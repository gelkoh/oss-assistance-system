<template>
    <div class="fixed inset-0 bg-neutral-950/50 backdrop-blur-xs">
        <div class="fixed top-[50%] left-[50%] -translate-[50%] bg-neutral-800 p-4 w-full max-w-2xl">
            <div class="flex justify-between items-start">
                <div class="text-2xl font-bold">Clone A Repository</div>

                <button @click="$emit('hide-clone-repository-popup')" class="cursor-pointer bg-neutral-700 hover:bg-neutral-600 rounded-full w-8 h-8 flex items-center justify-center">
                    <X />
                </button>
            </div>

            <div>
                <label for="url" class="mt-8 block font-bold">Repository URL</label>
                <input ref="repoUrl" type="text" placeholder="https://..." id="url" class="mt-2 p-2 border border-neutral-500 rounded-sm block w-full" />

                <div class="mt-4 font-bold">Path</div>

                <div class="flex gap-x-2 mt-2">
                    <input ref="targetPath" type="text" placeholder="Path to clone into" disabled class="grow p-2 bg-neutral-700 cursor-default rounded-sm">

                    <button @click="handleSelectTargetPath" class="cursor-pointer bg-neutral-700 h-[40px] w-[40px] flex items-center justify-center hover:bg-neutral-600 rounded-sm">
                        <Folder :size="18" />
                    </button>
                </div>
            </div>

            <button @click="handleClone" class="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-sm mt-10">
                Clone
            </button>
        </div>
    </div>
</template>

<script setup>
    import { ref } from "vue"
    import { X, Folder } from "lucide-vue-next"
    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()

    const isCloning = ref(false)
    const repoUrl = ref(null)
    const targetPath = ref(null)

    const handleClone = async () => {
        const url = repoUrl.value.value
        const localPath = targetPath.value.value

        if (!url || !localPath) {
            alert("Please provide an URL as well as a target path")
            return
        }

        try {
            isCloning.value = true

            const result = await window.api.cloneRepository(url, localPath)

            alert(`Cloning successful! Path: ${result.path}`)

            repoStore.readRepoContents(result.path)
        } catch(error) {
            alert(`Error while cloning: ${error.message}`)
            console.error("Clone Error: ", error)
        } finally {
            isCloning.value = false
        }
    }

    const handleSelectTargetPath = async () => {
        try {
            const selectedPath = await window.api.openTargetDirectoryDialog()

            if (selectedPath) {
                targetPath.value.value = selectedPath + "/"
                console.log("Target Path selected:", selectedPath)
            } else {
                console.log("Target Path selection canceled.")
            }
        } catch (error) {
            console.error("Error opening target dialog:", error)
        }
    }
</script>
