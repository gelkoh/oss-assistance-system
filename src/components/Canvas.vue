<template>
    <div ref="container" class="absolute top-0 left-0 w-full h-full -z-10">
        <div ref="backgroundDots" />
    </div>

    <ChatbotButton @chatbot-button-clicked="handleChatbotButtonClicked" />
    <Chatbot v-if="chatbotVisible" />
    <CanvasControls @expand-all="handleExpandAll" @collapse-all="handleCollapseAll" />
    <ZoomControls :zoomPercentage @zoomOut="handleZoomOut" @zoomIn="handleZoomIn" />
</template>

<script setup>
    import * as d3 from "d3"
    import { onMounted, ref, watch } from "vue"
    import { useFileIcons } from "../composables/useFileIcons.js"
    import CanvasControls from "../components/CanvasControls.vue"
    import ZoomControls from "../components/ZoomControls.vue"
    import ChatbotButton from "../components/ChatbotButton.vue"
    import Chatbot from "../components/Chatbot.vue"
    import hljs from "highlight.js"

    const { getIconClass } = useFileIcons()

    const props = defineProps({
        fileTree: {
            type: Object,
            required: true
        }
    })

    const container = ref(null)
    const backgroundDots = ref(null)

    const fileContents = ref("")

    let zoomBehavior
    const zoomPercentage = ref(100)
    let currentZoom = 1
    
    let collapseAll = false
    let expandAll = false

    const chatbotVisible = ref(false)

    onMounted(async () => {
        const rootData = d3.hierarchy(props.fileTree.children[0])

        await loadAllFileContents(rootData)

        renderTree(props.fileTree.children[0])
    })

    let colorIndex = -1
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
        colorIndex = -1
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

        zoomBehavior = d3.zoom()
            .scaleExtent([0.25, 2])
            .on("zoom", (event) => {
                g.attr("transform", event.transform)
                currentZoom = event.transform.k
                zoomPercentage.value = Math.floor(event.transform.k * 100)
            })

        svg.call(zoomBehavior)
        svg.on("dblclick.zoom", null)

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

        const g = svg.append("g").attr("transform", "translate(-500, 600)")

        const root = d3.hierarchy(data)
        const treeLayout = d3.tree().nodeSize([40, 900])
        sortNodesByType(root)
        treeLayout(root)
        applyDynamicOffsets(root)
        drawNode(root, g)
        collapseAll = false
        expandAll = false
    }

    function drawNode(node, parentGroup) {
        if (collapseAll) {
            node.data.showContent = false
        } else if (expandAll) {
            node.data.showContent = true
        }

        const group = parentGroup.append("g").attr("class", "dir-group")

        if (node.data.type === "directory") {
            colorIndex++
        }

        node.darkColor = getColor(colorIndex, 950)
        node.brightColor = getColor(colorIndex, 600)

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
                    .style("fill", node.darkColor)
                    .attr("opacity", 0.5)
                    .style("stroke", node.brightColor)

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
            .on("click", async (event) => {
                event.stopPropagation()

                if (node.data.type === "directory") {
                     // TODO: Expand/collapse behavior here
                } else {
                    node.data.showContent = !node.data.showContent

                    renderTree(props.fileTree.children[0])
                }
            })

        if (node.data.type === "file") {
            // TODO: Handle unknown file types
            const fileExtension = node.data.name.split(".").at(-1)

            let iconClassName = getIconClass(fileExtension, false)

            if (iconClassName === null) {
                iconClassName = "devicon-devicon-plain"
            }

            // Draw node rectangle
            nodeG
                .append("rect")
                .attr("width", 808)
                .attr("height", 24)
                .attr("y", -12)
                .attr("rx", 4)
                .attr("fill", node.brightColor)

            // Draw icon
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

                .html(`

                `)

            // Draw file name
            nodeG
                .append("text")
                .attr("dy", "0.32em")
                .attr("x", 26)
                .text(node.data.name)
                .attr("fill", "white")

            // Draw edit icon
            nodeG
                .append("foreignObject")
                .attr("width", 16)
                .attr("height", 16)
                .attr("x", 786)
                .attr("y", -8)
                .html(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
                `)
                .on("click", async (event) => {
                    event.stopPropagation()
                    window.api.openPath(node.data.path)
                })


            // Draw file contents
            const result = hljs.highlightAuto(node.data.code)
            const colorString = "1px solid " + node.colorBright

            const content = nodeG
                .append("foreignObject")
                .attr("width", 808)
                .attr("y", 11)
                .html(`
                    <div xmlns="http://www.w3.org/1999/xhtml">
                        <pre><code class="hljs whitespace-pre-wrap rounded-b-md" style="background: ${node.darkColor} !important; border: 1px solid ${node.brightColor}">${result.value}</code></pre>
                    </div>
                `)

            const div = content.select("div").node()
            const rect = div.getBoundingClientRect()

            if (rect.height > 0) {
                node.data.renderedHeight = rect.height
            }

            if (node.data.showContent) {
                content.attr("height", node.data.renderedHeight)
            }
        }
    }

    function getColor(colorIndex, lightness) {
        const index = colorIndex % (colors.length - 1)
        return `var(--color-${colors[index]}-${lightness})`
    }

    async function getFileContents(path) {
        try {
            const fileContentsString = await window.api.readFileContents(path)
            return fileContentsString
            console.log("File contents loaded successfully")
        } catch(err) {
            console.error("Error reading file content:", err)
            throw new Error(`Could not read file: ${err.message}`)
        }
    }

    function sortNodesByType(root) {
        root.each(node => {
            if (node.children) {
                node.children.sort((a, b) => {
                    if (a.data.type === b.data.type) return a.data.name.localeCompare(b.data.name)
                    return a.data.type === "file" ? -1 : 1
                })
            }
        })
    }

    function getNodeExtraHeight(node) {
        if (node.data.type === "file" && node.data.showContent) {
            return node.data.renderedHeight ?? 0
        }

        return 0
    }

    function applyDynamicOffsets(root) {
        let cumulativeOffset = 0

        root.eachBefore((node) => {
            node.x += cumulativeOffset

            const extra = getNodeExtraHeight(node)

            if (extra > 0) {
                cumulativeOffset += extra
            }
        })
    }

    async function loadAllFileContents(root) {
        const filePromises = []

        root.each(node => {
            if (node.data.type === "file") {
                const promise = getFileContents(node.data.path)
                    .then(content => {
                        node.data.code = content
                        console.log("File contents loaded")
                    })
                    .catch(err => {
                        console.warn(`Skipping file ${node.data.name} due to error: ${err.message}`)
                        node.data.code = `ERROR: ${err.message}` 
                    })

                filePromises.push(promise)
            }
        })

        await Promise.allSettled(filePromises)
        console.log("All file contents loaded or attempted.")
    }

    function handleZoomOut(amount) {
        console.log("Handling zooming out")
        const svg = d3.select(container.value).select("svg")

        let newZoom = currentZoom - amount
        const multiple = Math.ceil(newZoom / amount)

        newZoom = amount * multiple

        svg.call(zoomBehavior.scaleTo, newZoom)

        currentZoom = newZoom
    }

    function handleZoomIn(amount) {
        console.log("Handling zooming in")
        const svg = d3.select(container.value).select("svg")

        let newZoom = currentZoom + amount
        const multiple = Math.floor(newZoom / amount)
        newZoom = amount * multiple

        svg.call(zoomBehavior.scaleTo, newZoom)

        currentZoom = newZoom
    }

    function handleCollapseAll() {
        console.log("Handling collapse all")
        collapseAll = true
        renderTree(props.fileTree.children[0])
        renderTree(props.fileTree.children[0])
    }

    function handleExpandAll() {
        console.log("Handling expand all")
        expandAll = true
        renderTree(props.fileTree.children[0])
        renderTree(props.fileTree.children[0])
    }

    function handleChatbotButtonClicked() {
        chatbotVisible.value = !chatbotVisible.value
    }
</script>

<style scoped>
    .node text {
        font-family: monospace;
        font-size: 12px;
    }
</style>
