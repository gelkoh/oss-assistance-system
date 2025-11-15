<template>
    <div ref="reference" @mouseenter="showTooltip" @mouseleave="hideTooltip">
        <slot />
    </div>

    <div
        v-if="isVisible"
        ref="floating"
        :style="floatingStyles"
        class="bg-neutral-700 px-3 py-2 rounded-md z-10 text-nowrap"
    >
        {{ props.text }}

        <div
            ref="floatingArrow"
            class="bg-neutral-700 w-4 h-4 rotate-45 rounded-sm"
            :class="arrowClasses"
            :style="{
                position: 'absolute',
                left:
                middlewareData.arrow?.x != null
                    ? `${middlewareData.arrow.x}px`
                    : '',
                top:
                middlewareData.arrow?.y != null
                    ? `${middlewareData.arrow.y}px`
                    : '',
            }"
        ></div>
    </div>
</template>

<script setup>
    import { ref, computed } from "vue"
    import {
        useFloating,
        offset,
        shift,
        arrow
    } from "@floating-ui/vue"

    const props = defineProps({
        text: {
            type: String,
            required: true
        },
        placement: {
            type: String,
            required: true
        },
        offset: {
            type: Number,
            required: false,
            default: 0
        }
    })

    const isVisible = ref(false)

    const reference = ref(null)
    const floating = ref(null)
    const floatingArrow = ref(null)

    const { floatingStyles, middlewareData } = useFloating(reference, floating, {
        placement: props.placement,
        middleware: [
            offset(props.offset),
            shift(),
            arrow({ element: floatingArrow })
        ],
    })

    const showTooltip = () => {
        isVisible.value = true
    }

    const hideTooltip = () => {
        isVisible.value = false
    }

    const arrowClasses = computed(() => ({
        "bottom-0 translate-y-[40%]": middlewareData.arrow?.x == null && props.placement === "top",
        "top-0 -translate-y-[40%]": middlewareData.arrow?.x == null && props.placement === "bottom",
        "left-0 -translate-x-[40%]": middlewareData.arrow?.y == null && props.placement === "right",
        "right-0 translate-x-[40%]": middlewareData.arrow?.y == null && props.placement === "left",
    }))
</script>
