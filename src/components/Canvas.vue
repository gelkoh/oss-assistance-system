<template>
    <div ref="container" class="absolute top-0 left-0 w-full h-full -z-10">
        <div ref="backgroundDots" />
    </div>

    <CanvasControls @expand-all="handleExpandAll" @collapse-all="handleCollapseAll" />
    <ZoomControls :zoomPercentage @zoom-out="handleZoomOut" @zoom-in="handleZoomIn" />
</template>

<script setup>
    import * as d3 from "d3"
    import { onMounted, ref, watch, toRaw } from "vue"
    import { useFileIcons } from "../composables/useFileIcons.js"
    import CanvasControls from "../components/CanvasControls.vue"
    import ZoomControls from "../components/ZoomControls.vue"
    import hljs from "highlight.js"
    import { useRepoStateStore } from "../stores/repoState.js"
    import { Folder } from "lucide-vue-next"

    const repoStore = useRepoStateStore()

    const { getIconClass } = useFileIcons()

    const LINE_NUMBERS_WIDTH = 40
    const CODE_HORIZONTAL_OFFSET = 10
    const CODE_WIDTH = 808

    const NODE_HEIGHT = 40
    const HORIZONTAL_GAP = LINE_NUMBERS_WIDTH + CODE_HORIZONTAL_OFFSET + CODE_WIDTH + 100
    const INITIAL_TRANSLATE_X = 20
    const INITIAL_TRANSLATE_Y = 400

    const DIR_PADDING = 50

    const container = ref(null)

    let d3Root = null
    let d3G = null
    let i = 0

    let zoomBehavior
    const zoomPercentage = ref(100)
    let currentZoom = 1

    const MIN_ZOOM = 0.1
    const MAX_ZOOM = 2

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

    const getColor = (colorIndex, lightness) => {
        const index = colorIndex % (colors.length - 1)
        return `var(--color-${colors[index]}-${lightness})`
    }

    const sortNodesByType = (root) => {
        root.each(node => {
            if (node.children) {
                node.children.sort((a, b) => {
                    if (a.data.type === b.data.type) return a.data.name.localeCompare(b.data.name)
                    return a.data.type === "file" ? -1 : 1
                })
            }
        })
    }

    const updateIcons = (selection) => {
        selection.select(".chevron-icon")
            .html(d => {
                if (d.data.type === "directory") {
                    return d.data.isExpanded ? getChevronDownIcon() : getChevronRightIcon()
                }
                return ""
            })

        selection.select(".folder-icon")
            .html(d => {
                if (d.data.type === "directory") {
                    return d.data.isExpanded ? getFolderOpenIcon() : getFolderIcon()
                }
                return ""
            })
    }

    const treeLayout = d3.tree().nodeSize([NODE_HEIGHT + 20, HORIZONTAL_GAP])

    const initialCollapse = (d) => {
        if (d.data.type === "directory" && d.children) {
            d._children = d.children
            d.children = null
            d.data.isExpanded = false
            d._children.forEach(initialCollapse)
        } else if (d.data.type === "directory") {
            d.data.isExpanded = true
        }
    }

    const getFileContents = async (path) => {
        try {
            return await window.api.readFileContents(path)
        } catch(err) {
            console.error("Error reading file content:", err)
            throw new Error(`Could not read file: ${err.message}`)
        }
    }

    const loadAllFileContents = async (root) => {
        const filePromises = []

        root.each(d => {
            if (d.data.type === "file") {
                const promise = getFileContents(d.data.path)
                    .then(content => {
                        d.data.code = content
                        console.log("File contents loaded")
                    })
                    .catch(err => {
                        console.warn(`Skipping file ${d.data.name} due to error: ${err.message}`)
                        d.data.code = `ERROR: ${err.message}`
                    })

                filePromises.push(promise)
            }
        })

        await Promise.allSettled(filePromises)
        console.log("All file contents loaded or attempted.")
    }

    const drawDirectoryContainers = (g, rootNode) => {
        const directoryNodes = rootNode.descendants().filter(d =>
            d.data.type === "directory" && d.data.isExpanded && d.children && d.children.length > 0
        )

        const containers = g.selectAll("rect.dir-container")
            .data(directoryNodes, d => d.data.path)

        containers.exit().remove()

        console.log("CONTAINERS", containers)
        const containersEnter = containers.enter()
            .insert("rect", "g.node-group")
            .attr("class", "dir-container")
            .style("fill", d => d.color950 ?? getColor(0, 950))
            .style("stroke", d => d.color600 ?? getColor(0, 600))
            .style("stroke-width", 1.5)
            .style("rx", 6)
            .style("ry", 6)

        containers.merge(containersEnter)
            .each(function (d) {
                const descendants = d.descendants().slice(1)
                if (descendants.length === 0) return

                const yMin = d3.min(descendants, c => c.y)
                const yMax = d3.max(descendants, c => c.y)

                const xMin = d3.min(descendants, c => c.x)
                const xMax = d3.max(descendants, c => {
                    if (c.data.type === "file" && c.data.showContent) {
                        return c.x + (c.data.renderedHeight || 0)
                    }

                    return c.x
                })

                d.containerX = yMin - DIR_PADDING
                d.containerY = xMin - NODE_HEIGHT / 2 - DIR_PADDING

                d.containerWidth = (yMax - yMin) + LINE_NUMBERS_WIDTH + CODE_HORIZONTAL_OFFSET + CODE_WIDTH + 2 * DIR_PADDING
                d.containerHeight = (xMax - xMin) + NODE_HEIGHT + 2 * DIR_PADDING

            })
            .attr("x", d => d.containerX)
            .attr("y", d => d.containerY)
            .attr("width", d => d.containerWidth)
            .attr("height", d => d.containerHeight)

            const labels = g.selectAll("text.dir-label")
                .data(directoryNodes, d => d.data.path);

            labels.exit().remove();

            labels.enter()
                .append("text")
                .attr("class", "dir-label")
                .attr("fill", "white")
                .attr("font-size", 14)
                .merge(labels)
                .attr("x", d => d.containerX + 8)
                .attr("y", d => d.containerY + 18)
                .text(d => d.data.name + "/");

    }

    onMounted(async () => {
        const initialData = toRaw(repoStore.currentFileTree).children[0]
        d3Root = d3.hierarchy(initialData)
        sortNodesByType(d3Root)

        await loadAllFileContents(d3Root)

        d3Root.each(d => {
            if (!d.data) return

            if (d.data.type === "directory") {
                if (d.depth === 0 && d.children) {
                        d.children.forEach(initialCollapse)
                }

                d.data.isExpanded = !!d.children
            }

            if (d.data.type === "file") {
                d.data.showContent = false
            }
        })

        createTree(d3Root)
    })

    const addBackgroundDotPattern = (svg) => {
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
            .style("fill", "#333")

        svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "url(#dot-grid)")
            .style("pointer-events", "none")
    }

    const setChildren = (d, expanded = null) => {
        if (d.data.type !== "directory") return

        const hasChildren = d.children || d._children
        if (!hasChildren) return

        const newState = expanded === null ? !d.data.isExpanded : expanded

        if (newState) {
            d.children = d._children
            d._children = null
        } else {
            d._children = d.children
            d.children = null
        }

        d.data.isExpanded = newState
    }

    const getNodeExtraHeight = (d) => {
        if (d.data.type === "file" && d.data.showContent) {
            return d.data.renderedHeight
        }

        return 0
    }

    const applyDynamicOffsets = (root) => {
        let cumulativeOffset = 0

        root.eachBefore((d) => {
            if (!d.data) return

            d.x += cumulativeOffset

            const extra = getNodeExtraHeight(d)

            if (extra > 0) {
                cumulativeOffset += extra
            }
        })
    }

    const updateTree = (source) => {
        if (!d3Root || !d3G) return

        treeLayout(d3Root)
        applyDynamicOffsets(d3Root)

        const nodes = d3Root.descendants().filter(d => d.depth >= 0)

        const node = d3G.selectAll("g.node-group")
            .data(nodes, d => d.data.path || (d.id = ++i))

        node.exit()
            .attr("transform", `translate(${source.y},${source.x})`)
            .remove()

        const nodeEnter = node.enter()
            .append("g")
            .attr("class", d => `node-group node-depth-${d.depth} ${d.depth === 0 ? 'pointer-events-none' : ''}`)
            .attr("transform", `translate(${source.y0},${source.x0})`)

        drawNodeElements(nodeEnter)

        const nodeMerge = node.merge(nodeEnter)

        nodeMerge.filter(d => d.data.type === "directory")
                .call(updateIcons)

        const nodeUpdate = node.merge(nodeEnter)
            .attr("transform", d => `translate(${d.y},${d.x})`)

        drawDirectoryContainers(d3G, d3Root)

        nodes.forEach(d => {
            d.x0 = d.x
            d.y0 = d.y
        })
    }

    const drawNodeElements = (selection) => {
        selection.each(function(d) {
            if (!d.data) return

            const nodeG = d3.select(this)

            const clickableArea = nodeG.append("g")
                .attr("class", "node-clickable")
                .style("cursor", "pointer")
                .on("click", (event) => handleNodeClick(event, d))

            if (d.data.type === "directory") {
                colorIndex++
            }

            d.color950 = getColor(colorIndex, 950)
            d.color600 = getColor(colorIndex, 600)

            if (d.data.type === "file") {
                clickableArea.append("rect")
                    .attr("x", 0)
                    .attr("y", -NODE_HEIGHT / 2)
                    .attr("width", LINE_NUMBERS_WIDTH + CODE_HORIZONTAL_OFFSET + CODE_WIDTH)
                    .attr("height", NODE_HEIGHT)
                    .attr("fill", "#0a0a0a")
                    .attr("stroke", "#737373")
                    .attr("rx", 4)
                    .attr("ry", 4);

                // File name
                clickableArea.append("text")
                    .attr("class", "node-text")
                    .attr("dy", "0.32em")
                    .attr("x", 30)
                    .attr("fill", "white")
                    .text(d => d.data.name + (d.data.type === "directory" ? "/" : ""));
            } else {
                // Directory name
                clickableArea.append("text")
                    .attr("class", "node-text")
                    .attr("dy", "0.32em")
                    .attr("x", 44)
                    .attr("fill", "white")
                    .text(d => d.data.name + (d.data.type === "directory" ? "/" : ""));
            }

            // Chevron icon for directories
            clickableArea.append("foreignObject")
                .attr("class", "chevron-icon")
                .attr("width", 20)
                .attr("height", 20)
                .attr("x", 0)
                .attr("y", -10)
                .html(d => {
                    if (d.data.type === "directory") {
                        return d.data.isExpanded ? getChevronDownIcon() : getChevronRightIcon()
                    }
                    return ""
                })

            // Folder icon for directories
             clickableArea.append("foreignObject")
                .attr("class", "folder-icon")
                .attr("width", 20)
                .attr("height", 20)
                .attr("x", 20)
                .attr("y", -10)
                .html(d => {
                    if (d.data.type === "directory") {
                        return d.data.isExpanded ? getFolderOpenIcon() : getFolderIcon()
                    }
                    return ""
                })

            // Code content
            if (d.data.type === "file") {
                const fileExtension = d.data.name.split(".").at(-1)

                // File icon
                let iconClassName = getIconClass(fileExtension, true)

                if (iconClassName === null) {
                    iconClassName = "devicon-devicon-plain"
                }

                clickableArea
                    .append("foreignObject")
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("x", 10)
                    .attr("y", -12)
                    .style("pointer-events", "none")
                    .append("xhtml:i")
                    .attr("class", iconClassName)
                    .style("font-size", "12px")

                const codeGroup = nodeG.append("g").attr("class", "code-group")

                // Style code group
                codeGroup
                    .attr("class", "p-2")

                const highlightedCode = hljs.highlightAuto(d.data.code)

                const codeFO = codeGroup
                    .append("foreignObject")
                    .attr("class", "code-foreign-object")
                    .attr("x", 0)
                    .attr("y", NODE_HEIGHT / 2)
                    .attr("width", LINE_NUMBERS_WIDTH + CODE_HORIZONTAL_OFFSET + CODE_WIDTH)

                const codeDiv = codeFO
                    .append("xhtml:div")
                    .style("width", LINE_NUMBERS_WIDTH + CODE_HORIZONTAL_OFFSET + CODE_WIDTH)
                    .style("height", "auto")
                    .html(`
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            <pre><code class="hljs bg-neutral-950! whitespace-pre-wrap text-base font-[monospace]! rounded-b-md pt-2! pb-2! pr-3! pl-14! border border-neutral-500">${highlightedCode.value}</code></pre>
                        </div>
                    `)

                const nativeDiv = codeDiv.node()
                const rect = nativeDiv.getBoundingClientRect()

                d.data.renderedHeight = rect.height

                codeDiv.style("height", `${rect.height}px`)

                codeFO.attr("height", 0)

                d.data.codeForeignObject = codeFO

                // Line numbers
                const amountOfLines = d.data.renderedHeight / (16 * 1.5)
                const lineNumbersContainer = document.createElement("div")

                for (let i = 1; i <= amountOfLines; i++) {
                    const lineNumber = document.createElement("div")
                    lineNumber.textContent = i.toString()
                    lineNumbersContainer.appendChild(lineNumber)
                }

                const lineNumbers = codeGroup
                    .append("foreignObject")
                    .attr("width", LINE_NUMBERS_WIDTH)
                    .attr("height", 0)
                    .attr("class", "pt-[9px] pl-3 font-[monospace] text-base text-neutral-500 text-right")
                    .attr("x", 0)
                    .attr("y", 21)
                    .html(lineNumbersContainer.innerHTML)

                d.data.lineNumbers = lineNumbers
            }
        })
    }

    const handleNodeClick = (event, d) => {
        event.stopPropagation()

        const source = { x: d.x, y: d.y, x0: d.x0, y0: d.y0 }

        if (d.data.type === "directory") {
            setChildren(d)
            updateTree(source)
        } else {
            d.data.showContent = !d.data.showContent
            updateFileContentVisibility()
            updateTree(source)
        }
    }

    const updateFileContentVisibility = () => {
        d3.select(container.value).selectAll("g.node-group").each(function(d) {
            if (d && d.data && d.data.type === "file") {
                const isVisible = d.data.showContent
                const height = d.data.renderedHeight || 0

                if (d.data.codeForeignObject) {
                    d.data.codeForeignObject.attr("height", isVisible ? height : 0)
                }

                if (d.data.lineNumbers) {
                    d.data.lineNumbers.attr("height", isVisible ? height : 0)
                }
            }
        })
    }

    const createTree = (root) => {
        const svg = d3.select(container.value)
            .append("svg")
            .attr("class", "w-full h-full")

        addBackgroundDotPattern(svg)

        d3G = svg.append("g")
            .attr("class", "main-g")

        const initialTransform = d3.zoomIdentity.translate(INITIAL_TRANSLATE_X, INITIAL_TRANSLATE_Y)

        zoomBehavior = d3.zoom()
            .scaleExtent([MIN_ZOOM, MAX_ZOOM])
            .on("zoom", (event) => {
                d3G.attr("transform", event.transform)
                currentZoom = event.transform.k
                zoomPercentage.value = Math.floor(event.transform.k * 100)
            })

        svg.call(zoomBehavior)
        svg.call(zoomBehavior.transform, initialTransform)
        svg.on("dblclick.zoom", null)

        root.x0 = INITIAL_TRANSLATE_Y
        root.y0 = INITIAL_TRANSLATE_X

        // Initial draw
        updateTree(root)
    }

    const recursiveCollapseAll = (d) => {
        if (d.data.type === "directory" && d.children) {
            d._children = d.children
            d.children = null
            d.data.isExpanded = false
            d._children.forEach(recursiveCollapseAll)
        } else if (d.data.type === "file") {
            d.data.showContent = false
        }
    }

    const handleCollapseAll = () => {
        if (!d3Root) return

        const source = d3Root.descendants().find(d => d.depth === 0) || d3Root

        if (d3Root.children) {
            d3Root.children.forEach(recursiveCollapseAll)
        }

        d3Root.data.isExpanded = !!d3Root.children

        d3Root.each(d => {
            if (d.data.type === "file") {
                d.data.showContent = false
            }
        })

        updateFileContentVisibility()

        updateTree(source)
    }

    const handleExpandAll = () => {
        if (!d3Root) return

        const source = d3Root.descendants().find(d => d.depth === 0) || d3Root

        d3Root.each(d => {
            if (d.data.type === "directory") {
                if (d._children) {
                    d.children = d._children
                    d._children = null
                }

                d.data.isExpanded = true
            }

            if (d.data.type === "file") {
                d.data.showContent = true
            }
        })

        updateFileContentVisibility()

        updateTree(source)
    }

    const handleZoomOut = (amount) => {
        const svg = d3.select(container.value).select("svg")

        let newZoom = currentZoom - amount
        const multiple = Math.ceil(newZoom / amount)

        newZoom = amount * multiple

        if (newZoom < MIN_ZOOM) newZoom = MIN_ZOOM

        svg.call(zoomBehavior.scaleTo, newZoom)

        currentZoom = newZoom
    }

    const handleZoomIn = (amount) => {
        const svg = d3.select(container.value).select("svg")

        let newZoom = currentZoom + amount
        const multiple = Math.floor(newZoom / amount)
        newZoom = amount * multiple

        if (newZoom > MAX_ZOOM) newZoom = MAX_ZOOM

        svg.call(zoomBehavior.scaleTo, newZoom)

        currentZoom = newZoom
    }

    const getChevronRightIcon = () => `
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-open-icon lucide-folder-open h-4 w-4 text-white">
           <path d="m9 18 6-6-6-6"/>
       </svg>
    `

    const getChevronDownIcon = () => `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-open-icon lucide-folder-open h-4 w-4 text-white">
            <path d="m6 9 6 6 6-6"/>
        </svg>
    `

    const getFolderIcon = () => `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-icon lucide-folder h-4 w-4 text-white">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </svg>
    `

    const getFolderOpenIcon = () => `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-open-icon lucide-folder-open h-4 w-4 text-white">
            <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>
        </svg>
    `
</script>

<style scoped>
    .node text {
        font-family: monospace;
        font-size: 12px;
    }
</style>
