# OPC UA Client (Electron + Vue 3)

A modern, industrial-grade **OPC UA Client** desktop application built with **Electron**, **Vue 3**, **Vuetify**, and **Node-OPCUA**.

This application allows engineers and developers to connect to OPC UA servers, browse the address space, monitor real-time data changes, and write values to nodes.

![Dashboard Preview](docs/dashboard-preview.png)

## ✨ Key Features

*   **🔌 Connection Management**: Connect to any OPC UA server via `opc.tcp://` endpoint.
*   **📊 Real-time Monitoring**: Subscribe to multiple nodes and view live value updates.
*   **📝 Node Writing**: Write values to tags (supporting Double, Int32, Boolean, String) with strict type handling.
*   **🎨 Modern UI**: Clean, responsive interface built with Vuetify 3 and Material Design aesthetics.
*   **🚀 High Performance**: Optimized main/renderer architecture using Electron and Vite.
*   **🛡️ Secure**: Built-in certificate management (SecurityMode: None/Sign/SignAndEncrypt support pending).

## 🛠️ Prerequisites

*   **Node.js**: v18.0.0 or higher (LTS recommended).
*   **Git**: For version control.

## 🚀 Getting Started

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/opcua-client-electron.git
cd opcua-client-electron
npm install
```

### 2. Run in Development Mode

Start the Vite dev server and Electron app simultaneously with hot-reloading:

```bash
npm run electron:dev
```

### 3. Build for Production

Package the application as a standalone Windows executable (`.exe`):

```bash
npm run electron:build
```

**Build Artifacts:**
*   **Portable Binary**: `release/win-unpacked/OPC UA Client.exe`
*   **Installer**: `release/OPC UA Client Setup <version>.exe`

## 📖 Usage Guide

1.  **Connect**: Enter your server endpoint (e.g., `opc.tcp://localhost:4840`) in the top bar and click **Connect**.
2.  **Monitor**:
    *   Enter a Node ID (e.g., `ns=3;i=1001`) in the "Node Subscriptions" card.
    *   Click the **+** button.
    *   Watch the value update in real-time in the list below.
3.  **Write**:
    *   Go to the "Node Write" card.
    *   Fill in **Node ID** and select the **Data Type**.
    *   Enter the new **Value**.
    *   Click **Write Value**.

## ⚠️ Troubleshooting

**Build Error: "A required privilege is not held by the client"**

This occurs on Windows when `electron-builder` tries to create symbolic links without admin rights.
*   **Fix 1**: Run your terminal (PowerShell/CMD) as **Administrator**.
*   **Fix 2**: Enable **Developer Mode** in Windows Settings.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
