import { app, BrowserWindow, ipcMain } from 'electron';
import { OpcUaClientService } from './opcuaclient.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    const opcService = new OpcUaClientService();

    // IPC Handlers
    ipcMain.handle('opcua:connect', async (event, endpointUrl) => {
        try {
            return await opcService.connect(endpointUrl);
        } catch (error) {
            console.error("IPC Connect Error:", error);
            return { error: error.message };
        }
    });

    ipcMain.handle('opcua:disconnect', async () => {
        try {
            await opcService.disconnect();
            return true;
        } catch (error) {
            return { error: error.message };
        }
    });

    ipcMain.handle('opcua:write', async (event, nodeId, value, dataType) => {
        try {
            await opcService.write(nodeId, value, dataType);
            return true;
        } catch (error) {
            return { error: error.message };
        }
    });

    ipcMain.on('opcua:subscribe', async (event, nodeId) => {
        try {
            const win = BrowserWindow.getAllWindows()[0];
            await opcService.subscribe(nodeId, (val, type) => {
                if (win) {
                    win.webContents.send('opcua:value-changed', { nodeId, value: val, dataType: type });
                }
            });
        } catch (error) {
            console.error("IPC Subscribe Error:", error);
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
