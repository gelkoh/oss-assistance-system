<template>
    <div>
        <div class="text-2xl font-bold">Get Started</div>

        <div class="flex flex-col gap-3">
            <button @click="$emit('open-repo')" :disabled="isLoading" class="cursor-pointer mt-5 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-sm">Open Local Repository</button>
            <button @click="$emit('show-clone-repository-popup')" class="cursor-pointer bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-sm">Clone A Repository</button>
        </div>
    </div>
</template>

<script setup>
    defineProps({
        isLoading: Boolean
    })
</script>
