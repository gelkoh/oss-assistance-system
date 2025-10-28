<template>
    <div class="mt-2 p-4 bg-neutral-900 grow">
        <div ref="container" class="w-full h-full" />
    </div>
</template>

<script setup>
    import { onMounted, ref } from "vue"
    import * as d3 from "d3"

    const props = defineProps({
        fileTree: Object
    })

    const container = ref(null)

    onMounted(() => {
        const data = {
            name: "root",
            children: [
                { name: "src", children: [{ name: "main.js" }, { name: "App.vue" }] },
                { name: "public", children: [{ name: "index.html" }] }
            ]
        }

        const width = container.value.clientWidth
        const height = container.value.clientHeight

        console.log(props.fileTree)

        const svg = d3
            .select(container.value)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(
                d3.zoom().on("zoom", (event) => {
                    g.attr("transform", event.transform)
                })
            )

        const g = svg.append("g")

        //const root = d3.hierarchy(props.fileTree)
        const root = d3.hierarchy({
            name: "root",
            children: props.fileTree
        })

        const treeLayout = d3.tree().size([height, width - 160])
        treeLayout(root)

        g.selectAll(".link")
            .data(root.links())
            .join("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", 1.5)
            .attr(
                "d",
                d3
                    .linkHorizontal()
                    .x((d) => d.y)
                    .y((d) => d.x)
            )

        const node = g
            .selectAll(".node")
            .data(root.descendants())
            .join("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${d.y},${d.x})`)

        node
            .append("circle")
            .attr("r", 6)
            .attr("fill", (d) => (d.children ? "#f97316" : "#aaa"))
            .attr("stroke", "#222")
            .on("click", (event, d) => {
                alert(`Clicked on: ${d.data.name}`)
            })

        node
            .append("text")
            .attr("dy", "0.31em")
            .attr("x", (d) => (d.children ? -10 : 10))
            .attr("text-anchor", (d) => (d.children ? "end" : "start"))
            .text((d) => d.data.name)
            .attr("fill", "white")
            .clone(true)
            .lower()
            .attr("stroke", "black")
    })
</script>

<style scoped>
    .link {
        stroke: #666;
    }
</style>
