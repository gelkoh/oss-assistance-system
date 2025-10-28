<template>
    <div class="pl-6">
        <div v-if="file.type === 'directory'" @click="toggleOpen">
            <Folder v-if="!isOpen" :size="22" class="inline-block" />
            <FolderOpen v-else class="inline-block" />
            {{ file.name }}
        </div>

        <div v-else @click="$emit('file-selected', file.path)">
            <i v-if="iconClass.length > 0" :class="iconClass" />
            <FileQuestionMark v-else :size="20" class="inline-block" />
            {{ file.name }}
        </div>

        <ul v-if="isOpen">
            <li v-for="childFile in file.children" :key="childFile.path">
                <FileTree :file="childFile" @file-selected="$emit('file-selected', $event)" />
            </li>
        </ul>
    </div>
</template>

<script setup>
    import { ref } from "vue"
    import { Folder, FolderOpen, FileQuestionMark } from 'lucide-vue-next'
    import { useFileIcons } from "../composables/useFileIcons.js"

    const { getIconClass } = useFileIcons()

    const props = defineProps({
        file: Object
    })

    const isOpen = ref(false)
    const iconClass = ref("")

    if (props.file.type === "file") {
        const fileExtension = props.file.name.split(".").at(-1)

        let iconClassName = getIconClass(fileExtension, true)

        if (iconClassName !== null) {
            iconClass.value = iconClassName
        }
    }

    const toggleOpen = () => {
        isOpen.value = !isOpen.value
    }
</script>
