import { createApp, ref } from "vue"
import App from "./App.vue"
import hljs from "highlight.js"
import hljsVuePlugin from "@highlightjs/vue-plugin"
import "highlight.js/styles/atom-one-dark.css"
import "devicon/devicon.min.css"

const app = createApp(App)
app.use(hljsVuePlugin)
app.mount("#app")
