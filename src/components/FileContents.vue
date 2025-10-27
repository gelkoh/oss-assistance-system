<template>
    <div class="p-4 grow bg-neutral-900">
        File Contents

        <div class="mt-4">
            <highlightjs v-if="fileContents !== ''" autodetect :code="fileContents" />
        </div>
    </div>
</template>

<script setup>
    import { ref, watch } from "vue"
    import hljs from "highlight.js"

    const props = defineProps({
        filePath: String
    })

    const error = ref("")
    const fileContents = ref("")

    const getFileContents = async(path) => {
        error.value = null

        try {
            const fileContentsString = await window.api.readFileContents(path)
            fileContents.value = fileContentsString
            console.log("File contents loaded successfully")
        } catch(err) {
            error.value = `Failed to load file contents: ${err.message}`
            fileContents.value = ""
        }
    }

    watch(() => props.filePath, (newPath, oldPath) => {
        getFileContents(newPath)
    })
</script>
