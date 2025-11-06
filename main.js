const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen, desktopCapturer, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { exec } = require('child_process');

const store = new Store();
let tray = null;
let settingsWindow = null;
let screenshotWindow = null;

// 默认快捷键
const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+Q';

// 创建系统托盘
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开设置',
      click: () => {
        showSettingsWindow();
      }
    },
    {
      label: '截图识别 (' + (store.get('shortcut', DEFAULT_SHORTCUT)) + ')',
      click: () => {
        captureScreen();
      }
    },
    { type: 'separator' },
    {
      label: store.get('autoStart', false) ? '✓ 开机自启动' : '开机自启动',
      click: () => {
        toggleAutoStart();
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('QR Scanner - 二维码扫描工具');
  tray.setContextMenu(contextMenu);

  // 点击托盘图标显示设置
  tray.on('click', () => {
    showSettingsWindow();
  });
}

// 显示设置窗口
function showSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  settingsWindow.loadFile('src/index.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// 截图功能
async function captureScreen() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: screen.getPrimaryDisplay().workAreaSize
    });

    if (sources.length === 0) {
      console.error('无法获取屏幕源');
      return;
    }

    // 创建截图窗口
    const { width, height } = screen.getPrimaryDisplay().bounds;

    screenshotWindow = new BrowserWindow({
      fullscreen: true,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    screenshotWindow.loadFile('src/screenshot.html');

    // 发送屏幕截图数据
    screenshotWindow.webContents.on('did-finish-load', () => {
      screenshotWindow.webContents.send('screenshot-source', sources[0].thumbnail.toDataURL());
    });

    screenshotWindow.on('closed', () => {
      screenshotWindow = null;
    });

  } catch (error) {
    console.error('截图失败:', error);
  }
}

// 切换开机自启动
function toggleAutoStart() {
  const currentValue = store.get('autoStart', false);
  const newValue = !currentValue;

  app.setLoginItemSettings({
    openAtLogin: newValue,
    openAsHidden: true
  });

  store.set('autoStart', newValue);
  createTray(); // 重新创建托盘菜单以更新显示
}

// 注册全局快捷键
function registerShortcut() {
  // 清除旧快捷键
  globalShortcut.unregisterAll();

  const shortcut = store.get('shortcut', DEFAULT_SHORTCUT);

  const ret = globalShortcut.register(shortcut, () => {
    captureScreen();
  });

  if (!ret) {
    console.error('快捷键注册失败');
  }
}

// IPC 通信处理
ipcMain.on('get-settings', (event) => {
  event.reply('settings-data', {
    shortcut: store.get('shortcut', DEFAULT_SHORTCUT),
    autoStart: store.get('autoStart', false)
  });
});

ipcMain.on('save-shortcut', (event, shortcut) => {
  store.set('shortcut', shortcut);
  registerShortcut();
  createTray(); // 重新创建托盘菜单以更新显示
  event.reply('shortcut-saved', true);
});

ipcMain.on('close-screenshot', () => {
  if (screenshotWindow) {
    screenshotWindow.close();
  }
});

ipcMain.on('qr-detected', (event, text) => {
  if (screenshotWindow) {
    screenshotWindow.close();
  }

  // 判断是否为网址
  const urlPattern = /^(https?:\/\/|www\.)/i;

  if (urlPattern.test(text) || text.includes('.com') || text.includes('.cn') || text.includes('.org')) {
    // 是网址，用浏览器打开
    let url = text;
    if (!text.startsWith('http')) {
      url = 'http://' + text;
    }
    shell.openExternal(url);
  } else {
    // 不是网址，用记事本显示
    const tempFile = path.join(app.getPath('temp'), 'qr_result.txt');
    const fs = require('fs');
    fs.writeFileSync(tempFile, text, 'utf-8');

    // 根据不同平台打开记事本
    if (process.platform === 'win32') {
      exec(`notepad "${tempFile}"`);
    } else if (process.platform === 'darwin') {
      exec(`open -a TextEdit "${tempFile}"`);
    } else {
      // Linux
      exec(`xdg-open "${tempFile}"`);
    }
  }
});

// 应用就绪
app.whenReady().then(() => {
  createTray();
  registerShortcut();

  // 设置开机自启动（如果之前已设置）
  if (store.get('autoStart', false)) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true
    });
  }

  // macOS 特殊处理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      showSettingsWindow();
    }
  });
});

// 退出前清理
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Windows/Linux 下防止完全退出
app.on('window-all-closed', (e) => {
  // 不退出应用，保持在托盘
  if (process.platform !== 'darwin') {
    e.preventDefault();
  }
});
