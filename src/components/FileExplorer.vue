<template>
    <input type="search" class="p-1 rounded-sm mb-5 w-full border border-neutral-500" placeholder="Find" />

    <ul>
        <li v-for="file in fileTree.children">
            <FileTree
                :isOpen="true"
                :file
                class="min-w-xs border-none pt-0!"
            />
        </li>
    </ul>
</template>

<script setup>
    import FileTree from "../components/FileTree.vue"

    defineProps({
        fileTree: Object
    })
</script>
