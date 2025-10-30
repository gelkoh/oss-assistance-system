<template>
    <button class="flex items-center justify-center w-12 h-12 absolute top-6 right-6 bg-neutral-800 border border-neutral-500 rounded-md hover:bg-neutral-700" @click="$emit('chatbot-button-clicked')">
        <BotMessageSquare />
    </button>
</template>

<script setup>
    import { BotMessageSquare } from "lucide-vue-next"
</script>
