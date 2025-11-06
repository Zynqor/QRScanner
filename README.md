# QR Scanner - 跨平台二维码扫描工具

一个简洁高效的桌面二维码扫描工具，支持快捷键截图识别二维码。

## 📦 直接下载使用（无需安装环境）

**不想安装 Node.js？没问题！**

GitHub Actions 自动构建好了所有平台的可执行文件，直接下载即可使用：

1. 访问 [Actions 页面](../../actions)
2. 点击最新的成功构建（绿色✅）
3. 在页面底部下载你的系统对应的版本：
   - **Windows**: 下载 `QRScanner-Windows`
   - **macOS**: 下载 `QRScanner-macOS`
   - **Linux**: 下载 `QRScanner-Linux`

📖 详细下载指南请查看：[DOWNLOAD.md](DOWNLOAD.md)

---

## 功能特性

- **跨平台支持** - 支持 Windows、macOS 和 Linux
- **快捷键截图** - 自定义快捷键，快速启动截图识别
- **智能识别** - 自动识别二维码内容
- **智能处理**
  - 识别到网址自动用默认浏览器打开
  - 识别到文本自动用系统记事本显示
- **系统托盘** - 最小化到系统托盘，不占用任务栏
- **开机自启** - 可选开机自动启动，随时待命
- **界面美观** - 现代化的设置界面

## 安装依赖

确保已安装 Node.js (推荐 v16 或更高版本)

```bash
# 安装依赖
npm install
```

## 运行

### 开发模式

```bash
npm start
```

### 构建可执行文件

**Windows:**
```bash
npm run build:win
```

**macOS:**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

构建完成后，可执行文件将在 `dist` 目录中。

## 使用说明

### 首次运行

1. 启动应用后，会自动最小化到系统托盘
2. 点击托盘图标打开设置页面
3. 设置你喜欢的快捷键（默认：Ctrl+Shift+Q）
4. 可选择开机自启动

### 截图识别二维码

1. 按下设置的快捷键（或点击托盘菜单中的"截图识别"）
2. 鼠标会变成十字光标
3. 按住鼠标左键拖动，选择二维码区域
4. 释放鼠标，自动识别二维码
5. 按 ESC 键可取消截图

### 识别结果处理

- **网址** - 自动用默认浏览器打开
  - 支持 `http://`、`https://`、`www.` 开头的网址
  - 支持常见域名后缀：`.com`、`.cn`、`.org` 等

- **文本** - 自动用系统默认文本编辑器显示
  - Windows: 记事本 (Notepad)
  - macOS: 文本编辑 (TextEdit)
  - Linux: 系统默认文本编辑器

## 系统托盘菜单

- **打开设置** - 打开设置窗口
- **截图识别** - 开始截图识别二维码
- **开机自启动** - 切换开机自启动选项
- **退出** - 退出应用

## 快捷键说明

### 支持的修饰键

- `Ctrl` / `Command` (macOS)
- `Shift`
- `Alt`

### 快捷键示例

- `Ctrl+Shift+Q`
- `Alt+Q`
- `Ctrl+Alt+S`
- `Shift+F1`

### 设置快捷键

1. 打开设置页面
2. 点击"截图识别快捷键"输入框
3. 按下你想要的快捷键组合
4. 点击"保存设置"

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **jsQR** - 二维码识别库
- **electron-store** - 持久化配置存储

## 项目结构

```
QRScanner/
├── main.js              # Electron 主进程
├── package.json         # 项目配置
├── assets/              # 资源文件
│   ├── icon.png         # 应用图标
│   └── icon.svg         # SVG 图标源文件
└── src/                 # 源代码
    ├── index.html       # 设置页面
    ├── renderer.js      # 设置页面逻辑
    ├── screenshot.html  # 截图界面
    ├── screenshot.js    # 截图识别逻辑
    └── styles.css       # 样式文件
```

## 开发说明

### 修改默认快捷键

在 `main.js` 中修改：

```javascript
const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+Q';
```

### 自定义图标

替换 `assets/` 目录下的图标文件：

- `icon.png` - 256x256 PNG 图标
- `icon.ico` - Windows 图标（可选）
- `icon.icns` - macOS 图标（可选）

### 调试

打开开发者工具：

在设置窗口按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Option+I` (macOS)

## 常见问题

### Q: 快捷键不生效？

A: 请检查是否有其他软件占用了相同的快捷键，尝试更换其他快捷键组合。

### Q: 识别不到二维码？

A: 请确保：
- 选择区域包含完整的二维码
- 二维码清晰可见
- 截图区域不要太小

### Q: Windows 下找不到托盘图标？

A: 检查系统托盘设置，确保允许显示 QR Scanner 的图标。

### Q: 如何卸载？

A:
- Windows: 通过控制面板卸载
- macOS: 将应用拖到废纸篓
- Linux: 删除安装文件

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0 (2024)

- 初始版本发布
- 支持快捷键截图识别二维码
- 支持开机自启动
- 支持系统托盘
- 跨平台支持 (Windows/macOS/Linux)

## 作者

QR Scanner Team

---

**注意事项:**

1. 首次运行需要安装依赖: `npm install`
2. Linux 系统可能需要额外权限来设置开机自启动
3. 建议使用最新版本的 Node.js 和 Electron
4. 截图功能需要屏幕录制权限 (macOS)

## 技术支持

如有问题，请提交 [Issue](../../issues)。
