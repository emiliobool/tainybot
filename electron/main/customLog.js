const log = require('electron-log');
import { send } from './ui';

export function customLog(level, ...data) {
  // Log messages using electron-log
  log[level](...data);
   
  // console.log(`[${level}]`, ...data);

  // Send log data to the renderer process
  send('log', { level, data });
}