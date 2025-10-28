<template>
    <div ref="container" class="absolute top-0 left-0 w-full h-full -z-10">
        <div ref="backgroundDots" />
    </div>
</template>

<script setup>
    import * as d3 from "d3"
    import { onMounted, ref, watch } from "vue"
    import { useFileIcons } from "../composables/useFileIcons.js"

    const { getIconClass } = useFileIcons()

    const props = defineProps({
        fileTree: {
            type: Object,
            required: true
        }
    })

    const emit = defineEmits(["open-file"])

    const container = ref(null)
    const backgroundDots = ref(null)

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
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .classed("svg-content-responsive", true)
            .call(
                d3.zoom().scaleExtent([0.2, 2]).on("zoom", (event) => g.attr("transform", event.transform))
            )

        // Background dots
        const defs = svg.append("defs")

        defs.append("pattern")
            .attr("id", "dot-grid")
            .attr("width", 30)
            .attr("height", 30)
            .attr("patternUnits", "userSpaceOnUse")

            .append("circle")
            .attr("cx", 2)
            .attr("cy", 2)
            .attr("r", 1)
            .style("fill", "#444")

        svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "url(#dot-grid)")
            .style("pointer-events", "none")

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
            // TODO: Add directory icon
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
                .attr("x", bounds.x0 - paddingX + 10)
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
            // TODO: Handle unknown file types
            const fileExtension = node.data.name.split(".").at(-1)

            let iconClassName = getIconClass(fileExtension, false)
            console.log(iconClassName)

            if (iconClassName === null) {
                iconClassName = "devicon-devicon-plain"
            }

            // Draw node rectangle
            nodeG
                .append("rect")
                .attr("width", 736)
                .attr("height", 24)
                .attr("y", -12)
                .attr("rx", 4)
                .attr("fill", getColor(colorIndex, 500))

            nodeG
                .append("foreignObject")
                .attr("width", 20)
                .attr("height", 20)

                .attr("x", 10)
                .attr("y", -12)

                .style("pointer-events", "none")

                .append("xhtml:i")
                .attr("class", iconClassName)

                .style("font-size", "12px")
                //.style("color", "white");

            nodeG
                .append("text")
                .attr("dy", "0.32em")
                .attr("x", 26)
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
        const index = colorIndex % (colors.length - 1)
        return `var(--color-${colors[index]}-${lightness})`
    }
</script>

<style scoped>
    .node text {
        font-family: monospace;
        font-size: 12px;
    }
</style>
