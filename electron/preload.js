const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // Recording operations
  getRecordingsPath: () => ipcRenderer.invoke('get-recordings-path'),
  saveRecording: (recordingData, filename) => ipcRenderer.invoke('save-recording', recordingData, filename),
  
  // System info
  getPlatform: () => process.platform,
  isElectron: () => true,
  
  // Notifications
  showNotification: (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  },
  
  // Window controls (optional)
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
});

// Expose a limited set of Node.js APIs
contextBridge.exposeInMainWorld('nodeAPI', {
  process: {
    platform: process.platform,
    arch: process.arch,
    versions: process.versions,
  },
  path: {
    join: (...args) => require('path').join(...args),
    dirname: (path) => require('path').dirname(path),
    basename: (path) => require('path').basename(path),
  },
});

// Security: Remove the eval function
delete window.eval;

// Security: Prevent access to Node.js globals
delete window.global;
delete window.Buffer;
delete window.process;

// Log when preload script is loaded
console.log('Preload script loaded successfully');