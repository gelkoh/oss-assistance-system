<template>
    <div ref="container" class="w-full h-full bg-neutral-900"></div>
</template>

<script setup>
    import * as d3 from "d3"
    import { onMounted, ref, watch } from "vue"

    const props = defineProps({
    fileTree: {
        type: Object,
        required: true
    }
    })

    const emit = defineEmits(["open-file"])

    const container = ref(null)

    onMounted(() => {
        renderTree(props.fileTree.children[0])
    })

    let colorIndex = 0
    const colors = ["red",
                    "orange",
                    "amber",
                    "yellow",
                    "lime",
                    "green",
                    "emerald",
                    "teal",
                    "cyan",
                    "sky",
                    "blue",
                    "indigo",
                    "violet",
                    "purple",
                    "fuchsia",
                    "pink",
                    "rose"]

    function renderTree(fileTree) {
        d3.select(container.value).selectAll("*").remove()

        const data = fileTree
        const width = container.value.clientWidth
        const height = container.value.clientHeight

        const svg = d3
            .select(container.value)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(
                d3.zoom().scaleExtent([0.2, 2]).on("zoom", (event) => g.attr("transform", event.transform))
            )

        const g = svg.append("g").attr("transform", "translate(100, 50)")

        const root = d3.hierarchy(data)
        const treeLayout = d3.tree().nodeSize([40, 160])
        treeLayout(root)

        drawNode(root, g)
    }

    function drawNode(node, parentGroup) {
        const group = parentGroup.append("g").attr("class", "dir-group")

        // Draw children first (recursively)
        if (node.children) {
            node.children.forEach((child) => {
                drawNode(child, group)
            })
        }

        // Find bounds of all children to draw a background rect
        const childNodes = group.selectAll("g.dir-group").nodes()
        let bounds = null
        if (childNodes.length > 0) {
            const bbox = childNodes[0].getBBox()
            bounds = childNodes.slice(1).reduce(
                (acc, n) => {
                    const b = n.getBBox()
                    acc.x0 = Math.min(acc.x0, b.x)
                    acc.y0 = Math.min(acc.y0, b.y)
                    acc.x1 = Math.max(acc.x1, b.x + b.width)
                    acc.y1 = Math.max(acc.y1, b.y + b.height)
                    return acc
                },
                {
                    x0: bbox.x,
                    y0: bbox.y,
                    x1: bbox.x + bbox.width,
                    y1: bbox.y + bbox.height
                }
            )
        }

        // Background rectangle for directories
        if (node.data.type === "directory" && bounds) {
            const paddingX = 16
            const paddingY = 20

            group
                .insert("rect", ":first-child")
                    .attr("x", bounds.x0 - 20)
                    .attr("y", bounds.y0 - 30)
                    .attr("width", bounds.x1 - bounds.x0 + 40)
                    .attr("height", bounds.y1 - bounds.y0 + 60)
                    .attr("rx", 8)
                    .style("fill", getColor(colorIndex, 950))
                    .attr("opacity", 0.5)
                    .style("stroke", getColor(colorIndex, 500))

            colorIndex++

            group
                .append("text")
                .attr("x", bounds.x0 - paddingX + 8)
                .attr("y", bounds.y0 - paddingY + 14)
                .attr("font-size", 12)
                .attr("font-family", "monospace")
                .attr("fill", "white")
                .text(node.data.name + "/")
        }

        // Node position
        const x = node.y
        const y = node.x

        const nodeG = group
            .append("g")
            .attr("transform", `translate(${x},${y})`)
            .attr("class", "node")
            .style("cursor", "pointer")
            .on("click", (event) => {
            event.stopPropagation()
                if (node.data.type === "directory") {
                    // TODO: Expand/collapse behavior here
                } else {
                    emit("open-file", node.data.path)
                }
            })


        if (node.data.type === "file") {
            // Draw node rectangle
            nodeG
                .append("rect")
                .attr("width", 736)
                .attr("height", 24)
                .attr("y", -12)
                .attr("rx", 4)
                .attr("fill", getColor(colorIndex, 500))

            nodeG
                .append("text")
                .attr("dy", "0.32em")
                .attr("x", 10)
                .text(node.data.name)
                .attr("fill", "white")
        }

        function toggleChildren(d) {
            if (d.children) {
                d._children = d.children
                d.children = null
            } else {
                d.children = d._children
                d._children = null
            }
        }
    }

    function getColor(colorIndex, lightness) {
        return `var(--color-${colors[colorIndex]}-${lightness})`
    }
</script>

<style scoped>
    .node text {
        font-family: monospace;
        font-size: 12px;
    }
</style>
