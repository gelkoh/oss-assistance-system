<template>
    <div class="absolute right-6 bottom-6 bg-neutral-800 p-2 rounded-md border border-neutral-500 flex items-center">
        <button class="w-7 h-7 hover:bg-neutral-500 relative rounded-sm" @click="$emit('zoomOut', 0.25, $event)">
            <Minus class="inline-block w-full h-full absolute left-0 top-0" />
        </button>

        <span class="cursor-default mx-2 w-10 text-center">{{ zoomPercentage }}%</span>

        <button class="w-7 h-7 hover:bg-neutral-500 relative rounded-sm" @click="$emit('zoomIn', 0.25, $event)">
            <Plus class="inline-block w-full h-full absolute left-0 top-0" />
        </button>
    </div>
</template>

<script setup>
    import { Plus, Minus } from "lucide-vue-next"

    defineProps({
        zoomPercentage: {
            String,
            required: true
        }
    })
</script>
