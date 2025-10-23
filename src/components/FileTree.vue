<template>
    <div>
        <div v-for="file in files" :key="file">
            <File /> {{ file.name }}
        </div>
    </div>
</template>

<script setup>
    import { File } from 'lucide-vue-next';

    defineProps({
        files: {
            type: Array,
            required: true
        }
    })
</script>
