<template>
    <div>
        <div v-for="file in files" :key="file">
            {{ file.name }}
        </div>
    </div>
</template>

<script setup>
    defineProps({
        files: {
            type: Array,
            required: true
        }
    })
</script>
