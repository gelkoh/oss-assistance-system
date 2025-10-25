<template>
    <div class="pl-6">
        <div v-if="file.type === 'directory'" @click="toggleOpen">
            <Folder v-if="!isOpen" :size="22" class="inline-block" />
            <FolderOpen v-else class="inline-block" />
            {{ file.name }}
        </div>

        <div v-else>
            <File :size="22" class="inline-block" />
            {{ file.name }}
        </div>

        <ul v-if="isOpen">
            <li v-for="childFile in file.children">
                <FileTree :file="childFile" />
            </li>
        </ul>
    </div>
</template>

<script setup>
    import { ref } from "vue"
    import { Folder, FolderOpen, File } from 'lucide-vue-next';

    const isOpen = ref(false)

    const toggleOpen = () => {
        isOpen.value = !isOpen.value
    }

    defineProps({
        file: Object
    })
</script>
