const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { URL } = require('url');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
let rendererServer;
let rendererServerUrl;

// Wait for backend API to be ready
function waitForBackend(url, maxAttempts = 30, interval = 500) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(url, (res) => {
        // Any response means the server is up
        resolve(true);
      });
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(check, interval);
        } else {
          console.log('Backend not ready after max attempts, proceeding anyway');
          resolve(false);
        }
      });
      req.setTimeout(1000, () => {
        req.destroy();
        if (attempts < maxAttempts) {
          setTimeout(check, interval);
        } else {
          resolve(false);
        }
      });
    };
    check();
  });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

const rendererPorts = [4200, 4201, 4202, 0];

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function getPackagedUiRoot() {
  return path.join(app.getAppPath(), 'dist', 'bms-web', 'browser');
}

function getDevUiRoot() {
  return path.join(__dirname, '..', 'dist', 'bms-web', 'browser');
}

function listenOnPort(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener('listening', onListening);
      reject(err);
    };

    const onListening = () => {
      server.removeListener('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

async function startRendererServer(rootDir) {
  if (rendererServerUrl) {
    return rendererServerUrl;
  }

  if (!fs.existsSync(rootDir)) {
    return null;
  }

  const normalizedRoot = path.normalize(rootDir + path.sep);

  const server = http.createServer((req, res) => {
    const requestUrl = req.url || '/';
    let pathname = '/';

    try {
      const parsed = new URL(requestUrl, 'http://localhost');
      pathname = decodeURIComponent(parsed.pathname);
    } catch (err) {
      res.statusCode = 400;
      res.end('Bad request');
      return;
    }

    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    const hasExtension = path.extname(pathname) !== '';
    let filePath = hasExtension ? path.join(rootDir, pathname) : path.join(rootDir, 'index.html');
    filePath = path.normalize(filePath);

    if (!filePath.startsWith(normalizedRoot)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }

      res.setHeader('Content-Type', getContentType(filePath));
      res.end(data);
    });
  });

  let lastError;
  for (const port of rendererPorts) {
    try {
      await listenOnPort(server, port);
      const address = server.address();
      const resolvedPort = typeof address === 'string' ? null : address?.port;

      if (!resolvedPort) {
        throw new Error('Unable to resolve UI server port.');
      }

      rendererServer = server;
      rendererServerUrl = `http://localhost:${resolvedPort}`;
      return rendererServerUrl;
    } catch (err) {
      lastError = err;
      if (!err || err.code !== 'EADDRINUSE') {
        throw err;
      }
    }
  }

  throw lastError || new Error('Unable to start UI server.');
}

async function createWindow() {
  // Resolve preload path correctly for both dev and packaged modes
  const preloadPath = app.isPackaged
    ? path.join(app.getAppPath(), 'electron', 'preload.js')
    : path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#f6f1e7',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (app.isPackaged) {
    const uiRoot = getPackagedUiRoot();

    try {
      const startUrl = await startRendererServer(uiRoot);
      if (!startUrl) {
        mainWindow.loadURL(`data:text/plain,Missing UI at ${uiRoot}`);
      } else {
        mainWindow.loadURL(startUrl);
      }
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      mainWindow.loadURL(`data:text/plain,Failed to start UI server: ${message}`);
    }
  } else {
    // In dev mode, try to use the built files if they exist
    const devUiRoot = getDevUiRoot();
    if (fs.existsSync(devUiRoot)) {
      try {
        const startUrl = await startRendererServer(devUiRoot);
        if (startUrl) {
          mainWindow.loadURL(startUrl);
          mainWindow.webContents.openDevTools({ mode: 'detach' });
          return;
        }
      } catch (err) {
        console.error('Failed to start dev UI server:', err);
      }
    }
    // Fall back to Angular dev server
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:4200';
    mainWindow.loadURL(startUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  if (process.env.ELECTRON_DEBUG === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.on('did-fail-load', (_, code, desc, url) => {
    mainWindow.loadURL(`data:text/plain,Failed to load ${url} (${code}) ${desc}`);
  });
}

function startBackend() {
  if (process.env.BMS_SKIP_API === '1') return;

  const jwtKey = process.env.Jwt__Key || 'bms_desktop_local_key_please_change_32chars_min_0001';
  const apiEnv = {
    ...process.env,
    ASPNETCORE_URLS: 'http://localhost:5209',
    Jwt__Key: jwtKey,
    // Note: 'Jwt:Key' with colon is invalid on Windows - using Jwt__Key instead
    // .NET configuration system translates Jwt__Key to Jwt:Key automatically
    BMS_DESKTOP: '1',
    BMS_DB_PATH: path.join(app.getPath('userData'), 'bms.db')
  };

  if (app.isPackaged) {
    const apiDir = path.join(process.resourcesPath, 'api');
    const defaultExe = path.join(apiDir, 'BusinessManagementSystem.Api.exe');
    const apiPath = process.env.BMS_API_PATH || defaultExe;
    if (!fs.existsSync(apiPath)) {
      console.error('API executable not found at:', apiPath);
      return;
    }
    console.log('Starting API with env:', {
      BMS_DB_PATH: apiEnv.BMS_DB_PATH,
      Jwt__Key: apiEnv.Jwt__Key?.substring(0, 10) + '...',
      Jwt__Key_length: apiEnv.Jwt__Key?.length,
      cwd: apiDir
    });
    // CRITICAL: Set cwd to API directory so it can find appsettings.json
    backendProcess = spawn(apiPath, [], { stdio: 'pipe', env: apiEnv, cwd: apiDir, windowsHide: true, detached: false });
    backendProcess.stdout.on('data', (data) => console.log('[API]', data.toString()));
    backendProcess.stderr.on('data', (data) => console.error('[API]', data.toString()));
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

  backendProcess = spawn('dotnet', ['run', '--project', apiProjectPath], { stdio: 'inherit', env: apiEnv, windowsHide: true });
}

app.whenReady().then(async () => {
  startBackend();

  // Wait for backend to be ready before creating the window
  console.log('Waiting for backend to be ready...');
  await waitForBackend('http://localhost:5209/api/auth/me');
  console.log('Backend is ready, creating window...');

  await createWindow();

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

  if (rendererServer) {
    rendererServer.close();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
