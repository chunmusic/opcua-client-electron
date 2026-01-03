const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Add API methods here
    ping: () => 'pong',

    // OPC UA
    opcuaConnect: (url) => ipcRenderer.invoke('opcua:connect', url),
    opcuaDisconnect: () => ipcRenderer.invoke('opcua:disconnect'),
    opcuaWrite: (nodeId, value, dataType) => ipcRenderer.invoke('opcua:write', nodeId, value, dataType),
    opcuaSubscribe: (nodeId, callback) => {
        ipcRenderer.send('opcua:subscribe', nodeId);
        // Listen for updates
        const handler = (event, data) => {
            if (data.nodeId === nodeId) {
                callback(data.value, data.dataType);
            }
        };
        ipcRenderer.on('opcua:value-changed', handler);
        // Return a cleanup function
        return () => ipcRenderer.removeListener('opcua:value-changed', handler);
    }
});
