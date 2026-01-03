# Electron + Vue 3 Sample App

A modern desktop application built with **Electron**, **Vue 3**, and **Vite**.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed (LTS version recommended).
- **Git**: For version control.

## 🚀 Development Phase

To run the application in development mode with hot-reloading:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run electron:dev
    ```
    This command starts the Vite dev server and launches the Electron application window. Changes to your Vue components will be reflected immediately.

## 📦 Building via EXE Phase

To package the application as a standalone executable for Windows.

### Build Command

Run the following command to build the application:

```bash
npm run electron:build
```

### Build Output

After a successful build, your artifacts will be located in the `release` directory:

-   **Unpacked App**: `release/win-unpacked/Electron POC App.exe` (Run this to test the app without installing)
-   **Installer**: `release/Electron POC App Setup <version>.exe` (If successfully generated)

### ⚠️ Troubleshooting Build Issues

**"A required privilege is not held by the client"**

If you encounter this error during the build process, it is because `electron-builder` is trying to create symbolic links for its internal tools, which requires Administrator privileges on Windows.

**Solutions:**

1.  **Run as Administrator**: Open your PowerShell or Command Prompt as **Administrator** and run the build command again.
2.  **Enable Developer Mode**: Go to **Windows Settings > Update & Security > For developers** and enable **Developer Mode**. This allows symbolic links to be created without elevation.
