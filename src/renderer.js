const { createApp } = Vue

createApp({
    setup() {
        return {
            count: ref(0)
        }
    }
}).mount("#app")
