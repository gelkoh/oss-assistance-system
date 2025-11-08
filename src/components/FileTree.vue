<template>
    <div
        group
        v-if="file.type === 'directory'"
        class="relative pt-1"
    >
        <!-- Horizontal line before directories -->
        <div
            v-if="file.depth > 0"
            :style="{ left: `${24 * (file.depth + 1) - 18}px` }"
            class="absolute pointer-events-none top-[16px] w-3 h-px bg-neutral-500"
        ></div>

        <div @click="toggleOpen"
            :style="{ paddingLeft: `${24 * (file.depth + 1)}px` }"
            class="hover:bg-neutral-700 cursor-pointer"
        >
            <Folder v-if="!isOpen" :size="18" class="inline-block" />
            <FolderOpen v-else :size="18" class="inline-block" />
            {{ file.name }}
        </div>

        <ul v-if="isOpen" class="relative">
            <!-- Vertical line underneath directories -->
            <div
                :style="{ left: `${24 * (file.depth + 1) + 6}px` }"
                class="absolute pointer-events-none w-px h-[calc(100%-16px)] top-1 bg-neutral-500 z-1">
            </div>

            <li v-for="childFile in file.children" :key="childFile.path" class="relative">
                <FileTree :file="childFile" @file-selected="$emit('file-selected', $event)" />
            </li>
        </ul>
    </div>

    <div v-else class="relative pt-1">
        <!-- Horizontal line before files -->
        <div
            :style="{ left: `${24 * (file.depth + 1) - 18}px` }"
            class="absolute pointer-events-none top-[16px] w-3 h-px bg-neutral-500"
        ></div>

        <div
            @click="$emit('file-selected', file.path)"
            :style="{ paddingLeft: `${24 * (file.depth + 1)}px` }"
            class="flex justify-between items-center hover:bg-neutral-700 cursor-pointer pr-4"
        >
            <div>
                <i v-if="iconClass.length > 0" :class="iconClass" />
                <FileQuestionMark v-else :size="20" class="inline-block" />
                {{ file.name }}
            </div>

            <SquarePen :size="16" class="inline-block" @click="openFileInEditor(file.path)" />
        </div>

        <ul v-if="isOpen">
            <li v-for="childFile in file.children" :key="childFile.path">
                <FileTree :file="childFile" @file-selected="$emit('file-selected', $event)" />
            </li>
        </ul>
    </div>
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import { Folder, FolderOpen, FileQuestionMark, SquarePen } from 'lucide-vue-next'
    import { useFileIcons } from "../composables/useFileIcons.js"

    const { getIconClass } = useFileIcons()

    const props = defineProps({
        file: Object,
        isOpen: Boolean
    })

    const isOpen = ref(false)
    const iconClass = ref("")

    onMounted(() => {
        if (props.isOpen) isOpen.value = true
    })

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

    const openFileInEditor = (path) => {
        window.api.openPath(path)
        console.log(`Trying to open the file with path: ${path} in the default text editor`)
        console.log(typeof path)
    }
</script>
