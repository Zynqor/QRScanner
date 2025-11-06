# 如何下载已构建的可执行文件

无需安装 Node.js 或 Electron 环境，GitHub Actions 会自动为你构建好所有平台的可执行文件！

## 方法一：从 GitHub Actions 下载 (推荐)

1. **访问 GitHub 仓库页面**

2. **点击顶部的 "Actions" 标签**
   - 网址类似：`https://github.com/你的用户名/QRScanner/actions`

3. **找到最新的成功构建**
   - 查找带有 ✅ 绿色勾号的构建记录
   - 点击进入该构建详情页

4. **下载构建产物 (Artifacts)**

   在构建详情页面底部，你会看到三个下载链接：

   - **QRScanner-Windows** - Windows 版本
     - 包含 `.exe` 安装程序和 `.zip` 便携版
     - 适用于 Windows 10/11

   - **QRScanner-macOS** - macOS 版本
     - 包含 `.dmg` 磁盘映像
     - 适用于 macOS 10.13+

   - **QRScanner-Linux** - Linux 版本
     - 包含 `.AppImage` 和 `.deb` 包
     - 适用于 Ubuntu/Debian 等

5. **选择你的操作系统对应的版本，点击下载**

6. **解压并运行**
   - Windows: 双击 `.exe` 文件安装，或解压 `.zip` 直接运行
   - macOS: 打开 `.dmg` 并拖拽到应用程序文件夹
   - Linux:
     - AppImage: `chmod +x *.AppImage && ./QRScanner*.AppImage`
     - Deb: `sudo dpkg -i *.deb`

## 方法二：触发新构建

如果没有看到构建记录，可以手动触发一次构建：

1. 访问 Actions 页面
2. 点击左侧 "Build QR Scanner" 工作流
3. 点击右上角 "Run workflow" 按钮
4. 选择分支后点击 "Run workflow"
5. 等待约 5-10 分钟构建完成
6. 按照方法一下载

## 方法三：通过 Release 下载 (稳定版本)

如果仓库发布了 Release 版本：

1. 访问仓库主页
2. 点击右侧的 "Releases" 标签
3. 下载最新版本的安装包

## 注意事项

### Windows 用户
- 首次运行可能会提示 "Windows 已保护你的电脑"
- 点击 "更多信息" → "仍要运行"
- 这是因为应用没有数字签名（需要购买证书）

### macOS 用户
- 可能需要在 "系统偏好设置" → "安全性与隐私" 中允许运行
- 或者右键点击应用 → "打开"

### Linux 用户
- AppImage 需要添加执行权限：`chmod +x *.AppImage`
- 某些系统可能需要安装 `libfuse2`：`sudo apt install libfuse2`

## 文件说明

### Windows
- `QR Scanner Setup *.exe` - 安装程序（推荐）
- `QR Scanner *.zip` - 便携版（无需安装）

### macOS
- `QR Scanner-*.dmg` - 磁盘映像安装包

### Linux
- `QR Scanner-*.AppImage` - 通用格式（推荐）
- `qr-scanner_*_amd64.deb` - Debian/Ubuntu 包

## 构建状态

查看当前构建状态：

[![Build Status](https://github.com/你的用户名/QRScanner/workflows/Build%20QR%20Scanner/badge.svg)](https://github.com/你的用户名/QRScanner/actions)

## 问题排查

### 下载的文件在哪里？

Artifacts（构建产物）会被打包成 zip 文件下载，下载后需要解压。

### 下载链接过期了？

GitHub Actions 的 artifacts 默认保留 30 天。如果过期了，可以触发新的构建。

### 构建失败了？

1. 检查 Actions 页面的构建日志
2. 查看具体哪一步失败
3. 提交 Issue 报告问题

## 首次使用指南

下载安装后：

1. 启动应用（会自动最小化到系统托盘）
2. 点击托盘图标打开设置
3. 设置你喜欢的快捷键
4. 按快捷键测试截图功能
5. 选中二维码区域自动识别

---

**提示**: 建议启用"开机自启动"，这样随时可以用快捷键扫码！
