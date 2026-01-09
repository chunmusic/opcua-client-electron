import { reactive, computed } from 'vue'

const state = reactive({
    isConnected: false,
    endpointUrl: 'opc.tcp://opcuaserver.com:48010',
    isConnecting: false,
    logs: [],
    monitoredItems: [], // { nodeId, value, dataType, timestamp }
    events: [], // { time, severity, source, message, eventType }
    // Settings
    theme: 'light',
    endpointUrls: ['opc.tcp://opcuaserver.com:48010'],
    endpointUrls: ['opc.tcp://opcuaserver.com:48010'],
    error: null,
    // Context Actions
    nodeIdToWrite: 'ns=3;i=1002', // Default
    currentView: 'dashboard'
})

export const opcuaStore = {
    state,

    // Getters
    get isConnected() { return state.isConnected },
    get logs() { return state.logs },
    get events() { return state.events },

    // Actions
    async initSettings() {
        if (window.electronAPI && window.electronAPI.settings) {
            const settings = await window.electronAPI.settings.get();
            if (settings) {
                state.theme = settings.theme || 'light';
                state.endpointUrls = settings.endpointUrls || ['opc.tcp://opcuaserver.com:48010'];
                // Apply theme immediately if needed (usually handled by App.vue watcher)
            }
        }
    },

    async saveSetting(key, value) {
        state[key] = value;
        if (window.electronAPI && window.electronAPI.settings) {
            await window.electronAPI.settings.set(key, value);
        }
    },

    // Actions
    setConnecting(val) { state.isConnecting = val },
    setConnected(val) { state.isConnected = val },
    setConnected(val) { state.isConnected = val },
    setError(err) { state.error = err },

    setNodeToWrite(nodeId) {
        state.nodeIdToWrite = nodeId
    },

    setCurrentView(viewName) {
        state.currentView = viewName
    },

    addEvent(event) {
        state.events.unshift({
            id: Date.now() + Math.random(),
            ...event
        })
        if (state.events.length > 200) state.events.pop()
    },

    addLog(log) {
        state.logs.unshift({
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString(),
            ...log
        })
        if (state.logs.length > 50) state.logs.pop()
    },

    updateItem(nodeId, value, dataType) {
        const existing = state.monitoredItems.find(i => i.nodeId === nodeId)
        if (existing) {
            existing.value = value
            existing.dataType = dataType
            existing.timestamp = new Date().toLocaleTimeString()
        } else {
            state.monitoredItems.push({
                nodeId,
                value,
                dataType,
                timestamp: new Date().toLocaleTimeString()
            })
        }
    },

    reset() {
        state.isConnected = false
        state.monitoredItems = []
        state.error = null
    }
}
