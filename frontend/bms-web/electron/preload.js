const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('bmsApp', {
  platform: process.platform
});
