const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen, desktopCapturer, shell, clipboard, nativeImage, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { exec } = require('child_process');

// 设置应用名称（避免显示 "Electron"）
app.name = 'QR Scanner';
app.setName('QR Scanner');

// Windows 平台设置 AppUserModelId（确保通知显示正确的应用名称）
if (process.platform === 'win32') {
  app.setAppUserModelId('com.qrscanner.app');
}

// 单实例锁定（防止多开导致多个托盘图标）
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 如果没有获取到锁，说明已经有实例在运行，直接退出
  app.quit();
} else {
  // 当第二个实例启动时，聚焦到设置窗口（如果存在）
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (settingsWindow) {
      if (settingsWindow.isMinimized()) settingsWindow.restore();
      settingsWindow.focus();
    } else {
      showSettingsWindow();
    }
  });
}

const store = new Store();
let tray = null;
let settingsWindow = null;
let screenshotWindow = null;
let historyWindow = null;

// 默认快捷键
const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+Q';
const CLIPBOARD_SHORTCUT = 'CommandOrControl+Shift+V'; // 剪贴板识别
const HISTORY_SHORTCUT = 'CommandOrControl+Shift+H'; // 历史记录

// 初始化历史记录
if (!store.get('history')) {
  store.set('history', []);
}

// 初始化设置
if (store.get('autoCopy') === undefined) {
  store.set('autoCopy', true); // 默认开启自动复制
}

// 创建系统托盘
function createTray() {
  // 如果托盘已存在，先销毁（避免创建多个托盘图标）
  if (tray) {
    tray.destroy();
    tray = null;
  }

  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  tray = new Tray(iconPath);

  const menuTemplate = [
    {
      label: '打开设置',
      click: () => {
        showSettingsWindow();
      }
    },
    { type: 'separator' },
    {
      label: '截图识别 (' + formatShortcut(store.get('shortcut', DEFAULT_SHORTCUT)) + ')',
      click: () => {
        captureScreen();
      }
    },
    {
      label: '识别剪贴板图片 (' + formatShortcut(CLIPBOARD_SHORTCUT) + ')',
      click: () => {
        recognizeClipboardImage();
      }
    },
    {
      label: '历史记录 (' + formatShortcut(HISTORY_SHORTCUT) + ')',
      click: () => {
        showHistoryWindow();
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
    width: 600,
    height: 480,
    resizable: false,
    autoHideMenuBar: true,
    skipTaskbar: false,
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
    // 获取鼠标当前位置
    const cursorPoint = screen.getCursorScreenPoint();

    // 获取鼠标所在的显示器
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);

    // 获取所有显示器
    const allDisplays = screen.getAllDisplays();

    // 找到当前显示器的索引
    const displayIndex = allDisplays.findIndex(d => d.id === currentDisplay.id);

    // 获取屏幕截图源
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: currentDisplay.size.width * currentDisplay.scaleFactor,
        height: currentDisplay.size.height * currentDisplay.scaleFactor
      }
    });

    if (sources.length === 0) {
      console.error('无法获取屏幕源');
      return;
    }

    // 选择对应的屏幕源（通常索引一致）
    const targetSource = sources[displayIndex] || sources[0];

    // 在鼠标所在的显示器上创建全屏截图窗口
    screenshotWindow = new BrowserWindow({
      fullscreen: true,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      x: currentDisplay.bounds.x,
      y: currentDisplay.bounds.y,
      width: currentDisplay.bounds.width,
      height: currentDisplay.bounds.height,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    screenshotWindow.loadFile('src/screenshot.html');

    // 发送屏幕截图数据
    screenshotWindow.webContents.on('did-finish-load', () => {
      screenshotWindow.webContents.send('screenshot-source', targetSource.thumbnail.toDataURL());
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

  // 截图识别快捷键
  const shortcut = store.get('shortcut', DEFAULT_SHORTCUT);
  const ret1 = globalShortcut.register(shortcut, () => {
    captureScreen();
  });
  if (!ret1) {
    console.error('截图快捷键注册失败');
  }

  // 剪贴板识别快捷键
  const ret2 = globalShortcut.register(CLIPBOARD_SHORTCUT, () => {
    recognizeClipboardImage();
  });
  if (!ret2) {
    console.error('剪贴板快捷键注册失败');
  }

  // 历史记录快捷键
  const ret3 = globalShortcut.register(HISTORY_SHORTCUT, () => {
    showHistoryWindow();
  });
  if (!ret3) {
    console.error('历史记录快捷键注册失败');
  }
}

// IPC 通信处理
ipcMain.on('get-settings', (event) => {
  event.reply('settings-data', {
    shortcut: store.get('shortcut', DEFAULT_SHORTCUT),
    autoStart: store.get('autoStart', false),
    autoCopy: store.get('autoCopy', true)
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

  // 保存到历史记录
  addToHistory(text);

  // 自动复制到剪贴板（如果启用）
  if (store.get('autoCopy', true)) {
    clipboard.writeText(text);
    showNotification('已复制到剪贴板', text.length > 50 ? text.substring(0, 50) + '...' : text);
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

// ========== 新功能实现 ==========

// 格式化快捷键显示
function formatShortcut(shortcut) {
  return shortcut
    .replace('CommandOrControl', process.platform === 'darwin' ? 'Cmd' : 'Ctrl')
    .replace(/\+/g, '+');
}

// 识别剪贴板中的图片
async function recognizeClipboardImage() {
  try {
    const image = clipboard.readImage();

    if (image.isEmpty()) {
      showNotification('剪贴板中没有图片', '请先复制一张包含二维码的图片');
      return;
    }

    // 显示识别中通知
    showNotification('正在识别...', '识别剪贴板中的二维码');

    // 将图片转换为 Data URL
    const dataUrl = image.toDataURL();

    // 创建临时识别窗口（不显示）
    const recognizeWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    recognizeWindow.loadFile('src/recognize.html');

    recognizeWindow.webContents.on('did-finish-load', () => {
      recognizeWindow.webContents.send('recognize-image', dataUrl);
    });

    // 监听识别结果
    ipcMain.once('recognize-result', (event, result) => {
      recognizeWindow.close();

      if (result.success) {
        // 保存到历史记录
        addToHistory(result.text);

        // 自动复制
        if (store.get('autoCopy', true)) {
          clipboard.writeText(result.text);
          showNotification('识别成功并已复制', result.text.length > 50 ? result.text.substring(0, 50) + '...' : result.text);
        } else {
          showNotification('识别成功', result.text);
        }

        // 打开结果
        handleQRResult(result.text);
      } else {
        showNotification('识别失败', '未能识别到二维码，请确保图片清晰');
      }
    });

  } catch (error) {
    console.error('剪贴板识别失败:', error);
    showNotification('识别失败', error.message);
  }
}

// 处理二维码识别结果
function handleQRResult(text) {
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

    if (process.platform === 'win32') {
      exec(`notepad "${tempFile}"`);
    } else if (process.platform === 'darwin') {
      exec(`open -a TextEdit "${tempFile}"`);
    } else {
      exec(`xdg-open "${tempFile}"`);
    }
  }
}

// 显示历史记录窗口
function showHistoryWindow() {
  if (historyWindow) {
    historyWindow.focus();
    return;
  }

  historyWindow = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    autoHideMenuBar: true,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  historyWindow.loadFile('src/history.html');

  historyWindow.on('closed', () => {
    historyWindow = null;
  });
}

// 添加到历史记录
function addToHistory(text) {
  const history = store.get('history', []);

  const isUrl = /^(https?:\/\/|www\.)/i.test(text) || text.includes('.com') || text.includes('.cn') || text.includes('.org');

  const record = {
    text: text,
    type: isUrl ? 'url' : 'text',
    timestamp: Date.now()
  };

  // 避免重复（检查最近10条）
  const recentSame = history.slice(0, 10).find(item => item.text === text);
  if (!recentSame) {
    history.unshift(record);
  }

  // 只保留最近50条
  if (history.length > 50) {
    history.splice(50);
  }

  store.set('history', history);

  // 如果历史记录窗口打开，通知更新
  if (historyWindow) {
    historyWindow.webContents.send('history-updated', history);
  }
}

// 显示系统通知
function showNotification(title, body) {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title,
      body: body,
      icon: path.join(__dirname, 'assets', 'icon.png'),
      timeoutType: 'default'
    });

    notification.show();
  }
}

// IPC: 获取历史记录
ipcMain.on('get-history', (event) => {
  const history = store.get('history', []);
  event.reply('history-data', history);
});

// IPC: 清空历史记录
ipcMain.on('clear-history', (event) => {
  store.set('history', []);
  event.reply('history-cleared');
});

// IPC: 删除单条历史记录
ipcMain.on('delete-history-item', (event, timestamp) => {
  let history = store.get('history', []);
  history = history.filter(item => item.timestamp !== timestamp);
  store.set('history', history);
  event.reply('history-data', history);
});

// IPC: 打开历史记录项
ipcMain.on('open-history-item', (event, text) => {
  handleQRResult(text);
});
