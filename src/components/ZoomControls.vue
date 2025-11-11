<template>
    <div
        class="absolute right-4 top-4 p-1 bg-neutral-800 rounded-md flex
               gap-x-[1px]"
    >
        <button
            class="cursor-pointer w-8 h-8 flex items-center justify-center
                   hover:bg-neutral-700 rounded-sm active:bg-neutral-600"
            @click="$emit('zoom-out', 0.25, $event)"
        >
            <Minus class="w-full" />
        </button>

        <span class="cursor-pointer rounded-sm flex justify-center items-center
                     cursor-default w-14 text-center hover:bg-neutral-700
                     active:bg-neutral-600"
        >
            {{ zoomPercentage }}%
        </span>

        <button
            class="cursor-pointer w-8 h-8 flex items-center justify-center
                   bg-neutral-800 hover:bg-neutral-700 rounded-sm
                   active:bg-neutral-600"
            @click="$emit('zoom-in', 0.25, $event)"
        >
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
