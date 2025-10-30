<template>
    <div class="absolute p-2 bottom-6 left-[50%] -translate-x-[50%] bg-neutral-800 border border-neutral-500 rounded-md">
        <button @click="$emit('expand-all')" class="hover:bg-neutral-700 p-1 rounded-sm">
            Expand all
        </button>

        <button @click="$emit('collapse-all')" class="ml-4 hover:bg-neutral-700 p-1 rounded-sm">
            Collapse all
        </button>
    </div>
</template>

<script setup>

</script>
