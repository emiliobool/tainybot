const sqlite3 = require('sqlite3').verbose();
import { app } from 'electron';
import path from 'path'

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'db.sqlite');
// const db = new sqlite3.Database(dbPath);
console.log('dbPath', dbPath)

// initialize the database
let db = null

export function loadDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
                reject(err)
            }
            console.log('Connected to the database.');
            resolve()
        })
    })
}

export function getDatabaseFilePath() {
    return dbPath
}

export async function init() {
    await initializeSettingsTable()
    await initializeDataTable()
    await initializeContextTable()
}

export async function initializeSettingsTable() {
    if (await tableExists('settings')) return
    await run(`
    CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `)
    await run("INSERT INTO settings (key, value) VALUES (?, ?)", ['max_context_messages', '0'])
    await run("INSERT INTO settings (key, value) VALUES (?, ?)", ['data_refresh_interval', '30'])
}
export async function initializeDataTable() {
    if (await tableExists('data')) return
    return await run(`
    CREATE TABLE data (
        key TEXT PRIMARY KEY,
        value TEXT,
        user TEXT DEFAULT NULL,
        channel TEXT DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `)



}
export async function initializeContextTable() {
    if (await tableExists('context_messages')) return
    return await run(`
    CREATE TABLE context_messages (
        id INTEGER PRIMARY KEY,
        channel TEXT,
        user TEXT,
        role TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ); 
    `)
}

// export async function initializeMessagesTable() {
//     //
// }



async function tableExists(tableName: string) {
    const row = await get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [tableName])
    return row !== undefined
}

export async function setSetting(key, value) {
    const row = await get("SELECT * FROM settings WHERE key = ?", [key])
    if (row) {
        return await run("UPDATE settings SET value = ?  WHERE key = ?", [value, key])
    } else {
        return await run("INSERT INTO settings (key, value) VALUES (?, ?)", [key, value])
    }
}
export async function getSetting(key) {
    const row: any = await get("SELECT value FROM settings WHERE key = ?", [key])
    return row?.value
}

export async function getSettings() {
    const rows: any = await all("SELECT * FROM settings LIMIT 100")
    // convert rows to object
    // console.log(rows)
    const settings = {}
    if (rows)
        for (const row of rows) {
            settings[row.key] = row.value
        }
    return settings
}

export async function setData(key, value, user = null) {
    const row = await get("SELECT * FROM data WHERE key = ?", [key])
    if (row) {
        return await run("UPDATE data SET value = ?, user = ?  WHERE key = ?", [value, user, key])
    } else {
        return await run("INSERT INTO data (key, value, user) VALUES (?, ?, ?)", [key, value, user])
    }
}
export async function getData(key) {
    const row: any = await get("SELECT value FROM data WHERE key = ?", [key])
    return row?.value
}

export async function all(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

export async function get(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err)
            } else {
                resolve(row)
            }
        })
    })
}

export async function run(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve(true)
            }
        })
    })
}



export default db