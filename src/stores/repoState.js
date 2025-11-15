import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'

export const useRepoStateStore = defineStore('repoState', () => {
    const repoPath = ref("")

    const fileTree = ref(null)
    const issues = ref([])
    const targetedIssueId = ref(null)

    const fileExplorerState = ref({})

    const chatbotHistory = ref([])

    const searchQuery = ref("")

    const selectedIssue = ref({})

    const currentTargetIssue = computed(() => {
        if (!targetedIssueId.value) return {}
        return issues.value.find(i => i.id === targetedIssueId.value) || {}
    })

    const currentChatbotHistory = computed(() => {
        return chatbotHistory.value
    })

    const currentFileTree = computed(() => {
        return fileTree.value
    })

    async function loadRepoState(path) {
        if (!window.api) {
            console.error("API is not available.")
            return
        }

        repoPath.value = path

        const state = await window.api.loadRepoState(path)

        const cachedIssues = await window.api.loadIssuesCache(path)

        targetedIssueId.value = state.targetedIssueId || null
        fileExplorerState.value = state.fileExplorerState || {}
        chatbotHistory.value = state.chatbotHistory || []
        issues.value = cachedIssues;

        console.log("Repo State and Issues loaded.")
    }

    async function saveRepoState(updates = {}) {
        if (!repoPath.value) return

        const stateWithProxies = {
            targetedIssueId: targetedIssueId.value,
            fileExplorerState: fileExplorerState.value,
            chatbotHistory: chatbotHistory.value,
            ...updates
        }

        const finalData = JSON.parse(JSON.stringify(stateWithProxies))

        await window.api.saveRepoState(repoPath.value, finalData)
    }

    async function setFileTree(treeData) {
        fileTree.value = treeData
    }

    async function targetIssue(issueId) {
        if (issueId === targetedIssueId.value) {
            targetedIssueId.value = null

            issues.value.forEach(issue => {
                issue.is_targeted = false
            })
        } else {
            targetedIssueId.value = issueId

            issues.value.forEach(issue => {
                issue.is_targeted = issue.id === issueId
            })
        }

        await saveRepoState()
    }

    async function setDirectoryState(dirPath, isOpen) {
        fileExplorerState.value[dirPath] = isOpen

        await saveRepoState({ fileExplorerState: fileExplorerState.value })
    }

    function setSearchQuery(query) {
        searchQuery.value = query
    }

    const currentSearchQuery = computed(() => {
        return searchQuery.value
    })

    async function saveHistory(history) {
        chatbotHistory.value = history

        await saveRepoState({ chatbotHistory: chatbotHistory.value })
    }

    async function clearHistory() {
        chatbotHistory.value = []

        await saveRepoState({ chatbotHistory: chatbotHistory.value })
    }

    return {
        repoPath,
        setFileTree,
        currentFileTree,
        issues,
        targetedIssueId,
        fileExplorerState,
        chatbotHistory,

        selectedIssue,

        currentTargetIssue,

        setSearchQuery,
        currentSearchQuery,

        saveHistory,
        currentChatbotHistory,
        clearHistory,

        loadRepoState,
        saveRepoState,
        targetIssue,
        setDirectoryState
    }
})
