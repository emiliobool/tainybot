import * as bot from "./bot"
import * as db from "./db"
import * as settings from "./settings"
import { app, ipcMain } from 'electron';
import { BrowserWindow } from 'electron';
import { shell } from 'electron';
import log from 'electron-log';

export async function init() {
    console.log(await db.loadDatabase())
    await db.init()
    await bot.init()
    await settings.init()
}

ipcMain.on('open:link', async (event, link) => {
    shell.openExternal(link)
});

ipcMain.on('info:load', async (event, link) => {
    const version = app.getVersion()
    const logFilePath = log.transports.file.getFile().path;
    const dbFilePath = db.getDatabaseFilePath()
    const responseFilePath = bot.getResponseFilePath()
    event.reply('info:loaded', {
        version,
        logFilePath,
        dbFilePath,
        responseFilePath
        
    })
})

export function send(event: string, ...args: any[]) {
    const win = BrowserWindow.getAllWindows()[0]
    if(win){
        win.webContents.send(event, ...args)
    }
}
