// Pencereye yalnızca bu dar API açılır; köprü jetonu ana süreçte kalır.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ofis', {
  onOffice: (cb) => ipcRenderer.on('office', (_e, d) => cb(d)),
  onDetails: (cb) => ipcRenderer.on('details', (_e, d) => cb(d)),
  select: (key) => ipcRenderer.invoke('select', key),
  decide: (id, decision) => ipcRenderer.invoke('decide', { id, decision }),
  say: (agent, session, text) => ipcRenderer.invoke('say', { agent, session, text }),
  saveAgent: (id, fields) => ipcRenderer.invoke('agents:save', { id, fields }),
  removeAgent: (id) => ipcRenderer.invoke('agents:remove', id),
  catalog: () => ipcRenderer.invoke('catalog:list'),
  hire: (catalogId, engine) => ipcRenderer.invoke('agents:hire', { catalogId, engine }),
  commandAdmin: (text, opts) => ipcRenderer.invoke('admin:command', text, opts),
  onSpeak: (cb) => ipcRenderer.on('speak', (_e, d) => cb(d)),
  setConfig: (key, value) => ipcRenderer.invoke('config:set', { key, value }),
  boardAction: (id, action) => ipcRenderer.invoke('board:action', { id, action }),
  probeUsage: () => ipcRenderer.invoke('usage:probe'),
});
