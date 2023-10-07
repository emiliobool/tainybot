import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import * as ui from './ui'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log';
import { customLog } from './customLog'
import { Dialog } from '@headlessui/vue'


process.on('uncaughtException', (error) => {
  // log.error('Uncaught Exception:', error.message);
  customLog('error', 'Uncaught Exception:', error.message)
});

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST


// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'tainybot',
    icon: join(process.env.PUBLIC, 'icon-512x512.png'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => { })

  const contextMenu = createContextMenu();

  win.webContents.on('context-menu', (e, params) => {
    contextMenu.popup({window: win, x: params.x, y: params.y});
  });

}


function createContextMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { type: 'separator' },
    { role: 'selectAll' },
  ];

  const menu = Menu.buildFromTemplate(template);
  return menu;
}




autoUpdater.logger = log;
autoUpdater.logger["transports"].file.level = 'info';



// function sendLogToRenderer(level, data) {
//   const mainWindow = BrowserWindow.getAllWindows()[0];
//   if (mainWindow && mainWindow.webContents) {
//     mainWindow.webContents.send('log', { level, data });
//   }
// }

autoUpdater.on('checking-for-update', () => {
  customLog('info', 'Checking for update...');
  win.webContents.send('checking_for_update');
});

autoUpdater.on('update-not-available', (info) => {
  customLog('info', 'Update not available.');
  win.webContents.send('update_not_available');
})
autoUpdater.on('error', (err) => {
  customLog('info', 'Error in auto-updater. ' + err);
  win.webContents.send('error', err);
})

autoUpdater.on('update-available', () => {
  customLog('info', 'Update available.');
  win.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  customLog('info', 'Update downloaded');
  win.webContents.send('update_downloaded');
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  customLog('info', log_message);
  win.webContents.send('download_progress', progressObj);
})


// // Custom transport function
// function customTransport(msg) {
//   // Send log data to the renderer process
//   sendLogToRenderer(msg.level, msg.data);

//   // Call the default console and file transports
//   return [log.transports.console(msg), log.transports.file(msg)];
// }

// // Set the custom transport function for the rendererConsole
// log.transports.rendererConsole = customTransport;

customLog('info', 'App starting...');


let template: Electron.MenuItemConstructorOptions[] = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteAndMatchStyle' },
      { role: 'delete' },
      { role: 'selectAll' }
    ]
  }

]
if (process.platform === 'darwin') {
  // OS X
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: `About ${name} ${app.getVersion()}`,
        role: 'about',
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      }
    ]
  })
}

app.whenReady().then(() => {
  createWindow()

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  console.log('Checking for updates...');
  customLog('info', 'Checking for updates...');
  autoUpdater.checkForUpdatesAndNotify();

})

app.on('window-all-closed', () => {
  win = null
  // if (process.platform !== 'darwin') app.quit()
  app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})



// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }




})
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});


ui.init()