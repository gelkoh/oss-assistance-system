<template>
    <div class="absolute top-4 left-20 w-140 max-h-100 p-6 rounded-lg bg-neutral-800">
        <div class="mb-4 flex justify-between gap-x-6">
            <div class="flex items-center gap-x-3 text-2xl font-bold">
                <component :is="icon" class="inline-block" />
                {{ title }}
            </div>

            <button
                @click="$emit('close-panel', panelId)"
                class="w-11 h-11 flex justify-center items-center rounded-md cursor-pointer hover:bg-neutral-700"
            >
                <X />
            </button>
        </div>

        <slot></slot>
    </div>
</template>

<script setup>
    import { X } from "lucide-vue-next"

    const props = defineProps({
        icon: {
            type: [Object, Function],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        panelId: {
            type: String,
            required: true
        }
    })
</script>
