<template>
    <div class="w-120 h-240 bg-neutral-800 absolute top-6 left-24 rounded-md border border-neutral-500 p-4">
        <div class="flex flex-col h-full">
            Chatbot

            <div class="mt-4">
                <template v-for="message in chatHistory.messages" :key="message">
                    <div v-if="message.sender === 'chatbot'" class="mt-2">
                        {{ message.text }}
                    </div>

                    <div v-else class="mt-2 bg-neutral-900 p-2 rounded-md">
                        {{ message.text }}
                    </div>
                </template>
            </div>

            <div class="relative mt-auto h-24">
                <textarea placeholder="Enter a message" class="bg-neutral-700 p-4 rounded-md resize-none w-full h-full" ref="userInput" />

                <button class="absolute bottom-2 right-2 bg-blue-600 w-9 h-9 rounded-sm flex items-center justify-center hover:bg-blue-500">
                    <SendHorizontal @click="sendMessage" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref } from "vue"
    import { SendHorizontal } from "lucide-vue-next"

    const userInput = ref(null)

    const chatHistory = ref({
        messages: [
            {
                sender: "user",
                text: "Question"
            },
            {
                sender: "chatbot",
                text: "Answer"
            },
            {
                sender: "user",
                text: "Question"
            },
            {
                sender: "chatbot",
                text: "Answer"
            },
        ]
    })

    const sendMessage = () => {
        chatHistory.value.messages.push({
            sender: "user",
            text: userInput.value.value
        })

        chatHistory.value.messages.push({
            sender: "chatbot",
            text: "Answer"
        })

        userInput.value.value = ""
    }
</script>
