<template>
    <div
        class="absolute bottom-4 right-4 bg-neutral-800 rounded-md flex gap-x-2
               p-1"
    >
        <button
            @click="$emit('collapse-all')"
            class="flex items-center gap-x-2 px-2 cursor-pointer bg-neutral-800
                   hover:bg-neutral-700 h-8 rounded-sm active:bg-neutral-600"
        >
            <FoldVertical :size="22" />
            Collapse all
        </button>

        <button
            @click="$emit('expand-all')"
            class="flex items-center gap-x-2 px-2 cursor-pointer bg-neutral-800
                   hover:bg-neutral-700 h-8 rounded-sm active:bg-neutral-600"
        >
            <UnfoldVertical :size="22" />
            Expand all
        </button>
    </div>
</template>

<script setup>
    import { FoldVertical, UnfoldVertical } from "lucide-vue-next"
</script>
