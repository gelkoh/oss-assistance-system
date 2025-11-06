<template>
    <div class="absolute bottom-6 right-6 bg-neutral-500 border border-neutral-500 rounded-md flex gap-x-[1px] h-8">
        <button @click="$emit('expand-all')" class="px-2 cursor-pointer bg-neutral-800 hover:bg-neutral-700 rounded-l-md">
            Expand all
        </button>

        <button @click="$emit('collapse-all')" class="px-2 cursor-pointer bg-neutral-800 hover:bg-neutral-700 rounded-r-md">
            Collapse all
        </button>
    </div>
</template>

<script setup>

</script>
