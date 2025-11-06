<template>
    <div class="absolute right-6 top-6 bg-neutral-500 rounded-md border border-neutral-500 flex gap-x-[1px] h-8">
        <button class="cursor-pointer w-8 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-l-md" @click="$emit('zoom-out', 0.25, $event)">
            <Minus class="w-full" />
        </button>

        <span class="cursor-pointer flex justify-center items-center cursor-default w-14 text-center bg-neutral-800 hover:bg-neutral-700">{{ zoomPercentage }}%</span>

        <button class="cursor-pointer w-8 flex items-center jusitfy-center bg-neutral-800 hover:bg-neutral-700 rounded-r-md" @click="$emit('zoom-in', 0.25, $event)">
            <Plus class="w-full" />
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
