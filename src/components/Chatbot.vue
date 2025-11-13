<template>
    <div
        class="flex flex-col relative min-h-120 h-full overflow-hidden"
    >
        <div class="overflow-y-auto grow">
            <div v-if="chatHistory.length === 0" class="mx-20 text-center text-xl font-bold">
                Hello, how can I help you? <br />
                If this project is a GitHub repository, go over to the issues tab
                and target an issue to give me more context.
            </div>

            <div v-for="(message, index) in chatHistory" :key="index" class="flex flex-col">
                <div v-if="message.sender === 'assistant'" class="max-w-[90%]">
                    <template v-for="(part, index) in useMarkdownParser(message.text)" :key="index">
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
                </div>

                <div v-else class="max-w-[90%] mt-4 bg-neutral-700 rounded-md self-end p-3">
                    {{ message.text }}
                </div>
            </div>

            <p v-if="error" class="text-red-500">{{ error }}</p>
        </div>

        <div class="absolute w-full bottom-0 border border-neutral-500 bg-neutral-700 pt-3 px-4 pb-11 rounded-md">
            <textarea
                ref="textInput"
                v-model="currentMessage"
                @keyup="handleTextInputHeight"
                @keyup.enter="sendMessage"
                :disabled="isProcessing"
                placeholder="Enter a message"
                class="focus:outline-none resize-none w-full h-full min-h-[24px]"
                rows="1"
            />

            <div ref="textInputCopy" class="absolute invisible pointer-events-none">

            </div>

            <button
                @click="sendMessage"
                class="cursor-pointer absolute bottom-2 right-2 bg-neutral-600 w-9 h-9 rounded-sm flex items-center justify-center hover:bg-neutral-500"
            >
                <SendHorizontal />
            </button>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import { SendHorizontal } from "lucide-vue-next"
    import { useMarkdownParser } from "../composables/useMarkdownParser.js"
    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()

    const chatHistory = ref([])
    const currentMessage = ref("")
    const isProcessing = ref(false)
    const modelName = "codellama"
    const error = ref(null)
    const textInput = ref(null)
    const textInputCopy = ref(null)

    const parsedChatbotMessage = ref("")

    const sendMessage = async (event) => {
        if (event.shiftKey) {
            event.preventDefault()
            return
        }

        if (!currentMessage.value.trim()) return

        const userPrompt = currentMessage.value.trim()
        console.log("User prompt: ", userPrompt)
        chatHistory.value.push({ sender: "user", text: userPrompt })
        currentMessage.value = ""
        isProcessing.value = true
        error.value = null

        chatHistory.value.push({ sender: "assistant", text: "..." })

        const rawChatHistory = JSON.parse(JSON.stringify(chatHistory.value))

        const currentTargetIssue = repoStore.currentTargetIssue
        let currentTargetIssueBody

        if (currentTargetIssue.body) {
            currentTargetIssueBody = currentTargetIssue.body
        } else {
            currentTargetIssueBody = null
        }

        const issueMessage = {
            role: "system",
            content: currentTargetIssueBody
        }

        const chatHistoryArray = rawChatHistory
            .filter(msg => msg.text !== '...')
            .map(msg => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.text
            }))

        chatHistoryArray.unshift(issueMessage)

        try {
            const botResponse = await window.api.sendChatbotMessage(
                modelName,
                chatHistoryArray
            )

            chatHistory.value[chatHistory.value.length - 1].text = botResponse
        } catch(err) {
            error.value = err.message

            chatHistory.value[chatHistory.value.length - 1].text = `[ERROR] ${err.message}`
        } finally {
            isProcessing.value = false

            textInputCopy.value.style.height = "24px"
            textInput.value.style.height = "24px"
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
</script>
