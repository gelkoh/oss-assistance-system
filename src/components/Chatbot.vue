<template>
    <div
        class="flex flex-col relative min-h-120 h-full overflow-hidden"
    >
        <div class="overflow-y-auto grow pb-10">
            <div v-if="repoStore.currentChatbotHistory.length === 0" class="mx-20 text-center text-xl font-bold">
                Hello, how can I help you? <br />
                If this project is a GitHub repository, go over to the issues tab
                and target an issue to give me more context.
            </div>

            <div v-for="(message, index) in repoStore.currentChatbotHistory" :key="index" class="flex flex-col">
                <div v-if="message.sender === 'assistant'">
                    <template
                        v-if="message.status === 'success' ||
                              message.status === 'processing'" 
                        v-for="part in useMarkdownParser(message.text)"
                        :key="part.id"
                    >
                        <div v-if="part.type === 'paragraph'" class="mt-4">
                            <template v-for="(subPart, subIndex) in part.content" :key="subIndex">
                                <span v-if="subPart.type === 'text'">{{ subPart.content }}</span>

                                <code
                                    v-else-if="subPart.type === 'inline-code'"
                                    class="px-1.5 py-0.5 bg-neutral-950 rounded text-sm font-mono"
                                >
                                    {{ subPart.content }}
                                </code>
                            </template>
                        </div>

                        <highlightjs
                            v-else
                            autodetect
                            :code="part.content"
                            class="mt-4 whitespace-pre-wrap rounded-sm overflow-hidden *:bg-neutral-950!"
                        />
                    </template>

                    <div
                        v-else-if="message.status === 'aborted'"
                        class="mt-4 text-bold text-neutral-500"
                    >
                        {{ message.text }}
                        <div>(Generation aborted!)</div>
                    </div>

                    <div
                        v-else
                        class="mt-4 text-bold text-red-500"
                    >
                        {{ message.text }}
                    </div>
                </div>

                <div v-else class="mt-4 bg-neutral-700 rounded-md self-end p-3">
                    {{ message.text }}
                </div>
            </div>

            <div v-if="isProcessing" class="mt-4 loader"></div>
        </div>

        <div class="sticky bottom-0 left-0 bg-neutral-800">
            <div
                class="flex items-center gap-x-2 px-4 py-1 text-sm rounded-t-md border-t border-l border-r border-neutral-500"
                :class="[ repoStore.currentTargetIssue === null ? 'bg-orange-500/30' : 'bg-green-400/20' ]"
            >
                <template v-if="!repoStore.currentTargetIssue">
                    <Info :size="14" class="inline-block" /> Go to the issues panel and target an issue to give the chatbot more context on what you're trying to do.
                </template>

                <template v-else>
                    <CircleDot :size="14" class="inline-block" /> Targeted issue: {{ repoStore.currentTargetIssue.title }}
                </template>
            </div>

            <div class="before:w-full before:h-14 before:absolute before:left-0 before:top-0 before:-translate-y-full
                        before:bg-linear-to-t before:from-neutral-800/100 before:to-neutral-800/0 before:pointer-events-none before:-z-1"></div>
        </div>

        <div
            class="sticky bottom-0 z-1 w-full bottom-0"
        >
            <div class="border border-neutral-500 bg-neutral-700 py-3 px-4 rounded-b-md">
                <textarea
                    ref="textInput"
                    v-model="currentMessage"
                    @keyup="handleTextInputHeight"
                    @keyup.enter="sendMessage"
                    :disabled="isProcessing"
                    placeholder="Enter a message"
                    class="transition-[height] focus:outline-none resize-none w-full h-full min-h-[48px]"
                    rows="1"
                />

                <div ref="textInputCopy" class="absolute invisible pointer-events-none">

                </div>

                <div class="mt-1 flex justify-between">
                    <button class="cursor-pointer px-3 h-9 rounded-sm flex items-center justify-center hover:bg-neutral-500 gap-x-2">
                        <BrainCircuit :size="18" /> Codellama
                    </button>

                    <div>
                        <button
                            v-if="!isProcessing"
                            @click="sendMessage"
                            class="cursor-pointer bg-neutral-600 w-9 h-9 rounded-sm flex items-center justify-center hover:bg-neutral-500"
                        >
                            <SendHorizontal />
                        </button>

                        <button
                            v-else
                            @click="abortChatbotResponse"
                            class="cursor-pointer bg-neutral-600 w-9 h-9 rounded-sm flex items-center justify-center hover:bg-neutral-500"
                        >
                            <Square fill="#fff" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted, computed } from "vue"
    import { Info, CircleDot, SendHorizontal, BrainCircuit, Square } from "lucide-vue-next"
    import { useMarkdownParser } from "../composables/useMarkdownParser.js"
    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()

    const currentMessage = ref("")
    const isProcessing = ref(false)
    const modelName = "codellama"
    const textInput = ref(null)
    const textInputCopy = ref(null)

    onMounted(() => {
        window.api.onChatbotResponseChunk((contentChunk) => {
            const history = repoStore.currentChatbotHistory

            if (history.length > 0) {
                const lastMessage = history[history.length - 1]

                if (lastMessage.sender === "assistant" && lastMessage.status === "processing") {
                    lastMessage.text += contentChunk
                }
            }
        })

        window.api.onChatbotResponseAborted(() => {
            const history = repoStore.currentChatbotHistory

            if (history.length > 0) {
                const lastMessage = history[history.length - 1]

                if (lastMessage.sender === "assistant" && lastMessage.status === "processing") {
                    lastMessage.status = "aborted"
                }
            }
        })
    })

    const sendMessage = async (event) => {
        if (event.shiftKey) {
            event.preventDefault()
            return
        }

        if (!currentMessage.value.trim()) return

        const userPrompt = currentMessage.value.trim()

        repoStore.currentChatbotHistory.push({ sender: "user", text: userPrompt })
        currentMessage.value = ""

        isProcessing.value = true

        const rawChatbotHistory = JSON.parse(JSON.stringify(repoStore.currentChatbotHistory))

        const currentTargetIssue = repoStore.currentTargetIssue

        let currentTargetIssueBody

        if (currentTargetIssue.body) {
            currentTargetIssueBody = currentTargetIssue.body
        } else {
            currentTargetIssueBody = ""
        }

        const issueMessage = {
            role: "system",
            content: currentTargetIssueBody
        }

        const chatbotHistoryArray = rawChatbotHistory
            .map(msg => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.text
            }))

        chatbotHistoryArray.unshift(issueMessage)

        const currentChatbotHistory = repoStore.currentChatbotHistory

        const newBotMessageIndex = currentChatbotHistory.length;
        currentChatbotHistory.push({ sender: "assistant", text: "", status: "processing" }); // status: processing

        try {
            console.log("Chatbot history array: ", chatbotHistoryArray)
            await window.api.sendChatbotMessage(
                modelName,
                chatbotHistoryArray
            )

            currentChatbotHistory[newBotMessageIndex].status = "success";
        } catch(err) {
            if (err.message && err.message.includes("Chatbot generation aborted by user")) {
                console.log("Aborted successfully caught in sendMessage.")
                
                if (currentChatbotHistory[newBotMessageIndex].status === "processing") {
                    currentChatbotHistory[newBotMessageIndex].status = "aborted";
                }

                return
            }

            if (currentChatbotHistory[newBotMessageIndex].status === "processing") {
                currentChatbotHistory[newBotMessageIndex].text += `\n\n[ERROR] ${err.message}`;
                currentChatbotHistory[newBotMessageIndex].status = "error";
            } else {
                repoStore.currentChatbotHistory.push({ sender: "assistant", text: `[ERROR] ${err.message}`, status: "error" });
            }
        } finally {
            isProcessing.value = false

            textInputCopy.value.style.height = "24px"
            textInput.value.style.height = "24px"

            repoStore.saveHistory(currentChatbotHistory)
        }
    }

    const handleTextInputHeight = () => {
        const MAX_INPUT_HEIGHT = 168
        const LINE_HEIGHT = 24

        textInputCopy.value.style.width = textInput.value.offsetWidth + "px"

        const firstChild = textInputCopy.value.firstChild

        if (firstChild) {
            textInputCopy.value.removeChild(firstChild)
        }

        const textNode = document.createTextNode(textInput.value.value)
        textInputCopy.value.appendChild(textNode)

        // Count line breaks and add the height to the input
        const currentText = textInput.value.value
        const lineBreaks = currentText.split(/\r|\r\n|\n/)
        const lineBreaksCount = lineBreaks.length - 1

        const extraHeight = lineBreaksCount * LINE_HEIGHT

        if (textInputCopy.value.offsetHeight + extraHeight <= MAX_INPUT_HEIGHT) {
            textInput.value.style.height = textInputCopy.value.offsetHeight + extraHeight + "px"
        }
    }

    const abortChatbotResponse = () => {
        window.api.abortChatbotResponse()
        isProcessing.value = false
    }
</script>
