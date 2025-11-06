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

  const menuTemplate = [
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
    }
  ];

  // Windows 平台添加卸载选项
  if (process.platform === 'win32') {
    menuTemplate.push({ type: 'separator' });
    menuTemplate.push({
      label: '卸载程序',
      click: () => {
        openUninstaller();
      }
    });
  }

  menuTemplate.push({ type: 'separator' });
  menuTemplate.push({
    label: '退出',
    click: () => {
      app.quit();
    }
  });

  const contextMenu = Menu.buildFromTemplate(menuTemplate);

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

// 打开卸载程序
function openUninstaller() {
  if (process.platform === 'win32') {
    // 方式一：直接运行卸载程序（NSIS 会在安装目录创建 Uninstall.exe）
    const uninstallerPath = path.join(path.dirname(app.getPath('exe')), 'Uninstall QR Scanner.exe');
    const fs = require('fs');

    if (fs.existsSync(uninstallerPath)) {
      exec(`"${uninstallerPath}"`, (error) => {
        if (error) {
          // 如果直接运行失败，打开控制面板
          openControlPanel();
        }
      });
    } else {
      // 如果找不到卸载程序，打开控制面板
      openControlPanel();
    }
  }
}

// 打开 Windows 控制面板的卸载程序页面
function openControlPanel() {
  exec('appwiz.cpl', (error) => {
    if (error) {
      console.error('无法打开控制面板:', error);
    }
  });
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

// 防止所有窗口关闭时退出应用（保持托盘运行）
app.on('window-all-closed', () => {
  // 不做任何事，让应用继续在托盘中运行
  // 用户需要通过托盘菜单的"退出"来关闭应用
});
