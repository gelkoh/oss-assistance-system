<template>
    <div class="flex flex-col h-full">
        <div class="mt-4 overflow-y-auto">
            <template v-for="(message, index) in chatHistory" :key="index">
                <div v-if="message.sender === 'assistant'" class="mt-2">
                    {{ message.text }}
                </div>

                <div v-else class="mt-2 bg-neutral-900 p-2 rounded-md">
                    {{ message.text }}
                </div>
            </template>

            <p v-if="error" class="text-red-500">{{ error }}</p>
        </div>

        <div class="relative mt-auto h-24">
            <textarea v-model="currentMessage" @keyup.enter="sendMessage" :disabled="isProcessing" placeholder="Enter a message" class="bg-neutral-700 p-4 rounded-md resize-none w-full h-full" />

            <button @click="sendMessage" class="absolute bottom-2 right-2 bg-blue-600 w-9 h-9 rounded-sm flex items-center justify-center hover:bg-blue-500">
                <SendHorizontal />
            </button>
        </div>
    </div>
</template>

<script setup>
    import { ref } from "vue"
    import { SendHorizontal } from "lucide-vue-next"

    const props = defineProps({
        currentTargetIssue: Object
    })

    const chatHistory = ref([])
    const currentMessage = ref("")
    const isProcessing = ref(false)
    const modelName = "codellama"
    const error = ref(null)

    const sendMessage = async () => {
        if (!currentMessage.value.trim()) return

        const userPrompt = currentMessage.value.trim()
        console.log("User prompt: ", userPrompt)
        chatHistory.value.push({ sender: "user", text: userPrompt })
        currentMessage.value = ""
        isProcessing.value = true
        error.value = null

        chatHistory.value.push({ sender: "assistant", text: "..." })

        const rawChatHistory = JSON.parse(JSON.stringify(chatHistory.value))

        const issueMessage = {
            role: "system",
            content: props.currentTargetIssue.body
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
        }
    }
</script>
