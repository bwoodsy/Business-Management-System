const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#f6f1e7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (app.isPackaged) {
    const indexPath = path.join(app.getAppPath(), 'dist', 'bms-web', 'index.html');
    mainWindow.loadFile(indexPath);
  } else {
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:4200';
    mainWindow.loadURL(startUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function startBackend() {
  if (process.env.BMS_SKIP_API === '1') return;

  if (app.isPackaged) {
    const apiPath = process.env.BMS_API_PATH;
    if (!apiPath) return;
    backendProcess = spawn(apiPath, [], { stdio: 'inherit' });
    return;
  }

  const apiProjectPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'backend',
    'BusinessManagementSystem.Api'
  );

  if (!fs.existsSync(apiProjectPath)) return;

  backendProcess = spawn('dotnet', ['run', '--project', apiProjectPath], { stdio: 'inherit' });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
