<template>
    <div v-if="file.type === 'directory'" class="relative pl-6 pt-1 pr-4 before:absolute before:left-2 before:top-[16px] before:w-3 before:h-px before:bg-neutral-500">
        <div @click="toggleOpen">
            <Folder v-if="!isOpen" :size="18" class="inline-block" />
            <FolderOpen v-else :size="18" class="inline-block" />
            {{ file.name }}
        </div>

        <ul v-if="isOpen" class="relative after:w-px after:h-[calc(100%-17px)] after:absolute after:left after:bg-neutral-500 after:left-2 after:top-1">
            <li v-for="childFile in file.children" :key="childFile.path">
                <FileTree :file="childFile" @file-selected="$emit('file-selected', $event)" />
            </li>
        </ul>
    </div>

    <div v-else class="relative pl-6 pt-1 pr-4 before:absolute before:left-2 before:top-[50%] before:w-3 before:h-px before:bg-neutral-500">
        <div @click="$emit('file-selected', file.path)" >
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
