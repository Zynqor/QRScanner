const { ipcRenderer } = require('electron');

let currentShortcut = 'CommandOrControl+Shift+Q';
let isRecording = false;

// 加载设置
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('get-settings');

  // 快捷键输入框点击事件
  const shortcutInput = document.getElementById('shortcut');
  shortcutInput.addEventListener('click', () => {
    if (!isRecording) {
      startRecording();
    }
  });

  // 快捷键输入
  shortcutInput.addEventListener('keydown', (e) => {
    if (isRecording) {
      e.preventDefault();
      const shortcut = captureShortcut(e);
      if (shortcut) {
        shortcutInput.value = shortcut;
        currentShortcut = shortcut;
        stopRecording();
      }
    }
  });

  // 重置按钮
  document.getElementById('reset-shortcut').addEventListener('click', () => {
    currentShortcut = 'CommandOrControl+Shift+Q';
    shortcutInput.value = formatShortcutDisplay(currentShortcut);
  });

  // 保存按钮
  document.getElementById('save-btn').addEventListener('click', () => {
    const autoStart = document.getElementById('autoStart').checked;
    ipcRenderer.send('save-shortcut', currentShortcut);

    // 保存开机自启设置
    const { ipcRenderer: ipc } = require('electron');
    const Store = require('electron-store');
    const store = new Store();
    store.set('autoStart', autoStart);

    // 显示保存成功提示
    const btn = document.getElementById('save-btn');
    const originalText = btn.textContent;
    btn.textContent = '✓ 保存成功';
    btn.style.background = '#4CAF50';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
  });

  // 测试按钮
  document.getElementById('test-btn').addEventListener('click', () => {
    ipcRenderer.send('close-screenshot');
    setTimeout(() => {
      const { ipcRenderer } = require('electron');
      ipcRenderer.send('test-screenshot');
    }, 100);
  });
});

// 接收设置数据
ipcRenderer.on('settings-data', (event, data) => {
  currentShortcut = data.shortcut;
  document.getElementById('shortcut').value = formatShortcutDisplay(data.shortcut);
  document.getElementById('autoStart').checked = data.autoStart;
});

ipcRenderer.on('shortcut-saved', (event, success) => {
  if (success) {
    console.log('快捷键保存成功');
  }
});

// 开始记录快捷键
function startRecording() {
  isRecording = true;
  const input = document.getElementById('shortcut');
  input.value = '请按下快捷键...';
  input.classList.add('recording');
}

// 停止记录
function stopRecording() {
  isRecording = false;
  const input = document.getElementById('shortcut');
  input.classList.remove('recording');
}

// 捕获快捷键
function captureShortcut(e) {
  const keys = [];

  // 修饰键
  if (e.ctrlKey || e.metaKey) {
    keys.push('CommandOrControl');
  }
  if (e.shiftKey) {
    keys.push('Shift');
  }
  if (e.altKey) {
    keys.push('Alt');
  }

  // 主键
  const key = e.key.toUpperCase();
  if (key.length === 1 || ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(key.toUpperCase())) {
    keys.push(key);
  }

  // 需要至少有一个修饰键和一个主键
  if (keys.length >= 2) {
    return keys.join('+');
  }

  return null;
}

// 格式化快捷键显示
function formatShortcutDisplay(shortcut) {
  return shortcut
    .replace('CommandOrControl', process.platform === 'darwin' ? 'Cmd' : 'Ctrl')
    .replace('+', ' + ');
}
