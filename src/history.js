const { ipcRenderer } = require('electron');

let allHistory = [];
let filteredHistory = [];

// 加载历史记录
window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.send('get-history');

  // 搜索框
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    if (keyword) {
      filteredHistory = allHistory.filter(item =>
        item.text.toLowerCase().includes(keyword)
      );
    } else {
      filteredHistory = allHistory;
    }
    renderHistory();
  });

  // 关闭按钮
  document.getElementById('closeBtn').addEventListener('click', () => {
    window.close();
  });

  // 清空按钮
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      ipcRenderer.send('clear-history');
    }
  });
});

// 接收历史记录数据
ipcRenderer.on('history-data', (event, history) => {
  allHistory = history;
  filteredHistory = history;
  renderHistory();
});

// 历史记录已清空
ipcRenderer.on('history-cleared', () => {
  allHistory = [];
  filteredHistory = [];
  renderHistory();
});

// 历史记录已更新（从主进程）
ipcRenderer.on('history-updated', (event, history) => {
  allHistory = history;
  filteredHistory = history;
  renderHistory();
});

// 渲染历史记录
function renderHistory() {
  const listContainer = document.getElementById('historyList');

  if (filteredHistory.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div>暂无历史记录</div>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filteredHistory.map(item => {
    const time = formatTime(item.timestamp);
    const typeLabel = item.type === 'url' ? 'URL' : '文本';
    const typeClass = item.type === 'url' ? 'type-url' : 'type-text';
    const preview = item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text;

    return `
      <div class="history-item" data-timestamp="${item.timestamp}">
        <div class="history-item-content">
          <span class="history-item-type ${typeClass}">${typeLabel}</span>
          <div class="history-item-text">${escapeHtml(preview)}</div>
          <div class="history-item-time">${time}</div>
        </div>
        <div class="history-item-delete" data-timestamp="${item.timestamp}">✕</div>
      </div>
    `;
  }).join('');

  // 绑定点击事件
  document.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('history-item-delete')) {
        // 删除单条
        const timestamp = parseInt(e.target.dataset.timestamp);
        ipcRenderer.send('delete-history-item', timestamp);
      } else {
        // 打开历史记录项
        const timestamp = parseInt(el.dataset.timestamp);
        const item = allHistory.find(h => h.timestamp === timestamp);
        if (item) {
          ipcRenderer.send('open-history-item', item.text);
          window.close();
        }
      }
    });
  });
}

// 格式化时间
function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`;
  } else {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

// 转义 HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
