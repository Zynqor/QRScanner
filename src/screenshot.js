const { ipcRenderer } = require('electron');
const jsQR = require('jsqr');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const hint = document.getElementById('hint');
const sizeInfo = document.getElementById('size-info');
const resultDiv = document.getElementById('result');

let screenshotImage = null;
let isDrawing = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// 设置画布大小
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 接收屏幕截图
ipcRenderer.on('screenshot-source', (event, dataUrl) => {
  const img = new Image();
  img.onload = () => {
    screenshotImage = img;
    drawScreen();
  };
  img.src = dataUrl;
});

// 绘制屏幕
function drawScreen() {
  if (!screenshotImage) return;

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制背景图片（半透明遮罩）
  ctx.globalAlpha = 0.4;
  ctx.drawImage(screenshotImage, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;

  // 绘制选择框
  if (isDrawing) {
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // 绘制暗色遮罩（排除选择区域）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 清除选择区域，显示原图
    ctx.clearRect(x, y, width, height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.globalAlpha = 1.0;
    ctx.drawImage(screenshotImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 绘制选择框边框 (微软蓝色)
    ctx.strokeStyle = '#0078D4';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // 绘制四个角的调整点
    const cornerSize = 6;
    ctx.fillStyle = '#0078D4';

    // 左上
    ctx.fillRect(x - cornerSize/2, y - cornerSize/2, cornerSize, cornerSize);
    // 右上
    ctx.fillRect(x + width - cornerSize/2, y - cornerSize/2, cornerSize, cornerSize);
    // 左下
    ctx.fillRect(x - cornerSize/2, y + height - cornerSize/2, cornerSize, cornerSize);
    // 右下
    ctx.fillRect(x + width - cornerSize/2, y + height - cornerSize/2, cornerSize, cornerSize);

    // 显示尺寸信息（使用HTML元素，更美观）
    if (width > 0 && height > 0) {
      sizeInfo.textContent = `${Math.round(width)} × ${Math.round(height)} px`;
      sizeInfo.style.display = 'block';

      // 定位尺寸信息框（在选择框上方）
      const infoX = x + width / 2 - sizeInfo.offsetWidth / 2;
      const infoY = y - sizeInfo.offsetHeight - 8;

      // 如果上方空间不够，显示在下方
      if (infoY < 40) {
        sizeInfo.style.top = (y + height + 8) + 'px';
      } else {
        sizeInfo.style.top = infoY + 'px';
      }

      sizeInfo.style.left = Math.max(10, Math.min(infoX, window.innerWidth - sizeInfo.offsetWidth - 10)) + 'px';
    }
  } else {
    sizeInfo.style.display = 'none';
  }
}

// 鼠标按下
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  startX = e.clientX;
  startY = e.clientY;
  currentX = e.clientX;
  currentY = e.clientY;

  // 隐藏提示
  hint.style.opacity = '0.5';
});

// 鼠标移动
canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    currentX = e.clientX;
    currentY = e.clientY;
    drawScreen();
  }
});

// 鼠标释放
canvas.addEventListener('mouseup', (e) => {
  if (!isDrawing) return;

  isDrawing = false;
  currentX = e.clientX;
  currentY = e.clientY;

  // 计算选择区域
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  if (width < 10 || height < 10) {
    showResult('❌ 选择区域太小，请重新选择', true);
    setTimeout(() => {
      // 重置状态，允许重新选择
      hint.style.opacity = '1';
      sizeInfo.style.display = 'none';
      drawScreen();
      resultDiv.style.display = 'none';
    }, 1500);
    return;
  }

  // 从选择区域提取图像数据
  recognizeQRCode(x, y, width, height);
});

// 识别二维码
function recognizeQRCode(x, y, width, height) {
  hint.style.display = 'none';
  sizeInfo.style.display = 'none';

  // 显示识别中状态
  showResult('<span class="spinner"></span>正在识别二维码...', false, 'processing');

  // 使用 setTimeout 让UI有时间更新
  setTimeout(() => {
    try {
      // 创建临时画布
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');

      // 绘制选择区域的原始图像
      const scaleX = screenshotImage.width / canvas.width;
      const scaleY = screenshotImage.height / canvas.height;

      tempCtx.drawImage(
        screenshotImage,
        x * scaleX, y * scaleY, width * scaleX, height * scaleY,
        0, 0, width, height
      );

      // 获取图像数据
      const imageData = tempCtx.getImageData(0, 0, width, height);

      // 使用 jsQR 识别
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        const preview = code.data.length > 50 ? code.data.substring(0, 50) + '...' : code.data;
        showResult(`✅ 识别成功: ${preview}`);
        setTimeout(() => {
          ipcRenderer.send('qr-detected', code.data);
        }, 800);
      } else {
        showResult('❌ 未识别到二维码，请确保选择区域包含完整的二维码', true);
        setTimeout(() => {
          ipcRenderer.send('close-screenshot');
        }, 2000);
      }
    } catch (error) {
      showResult('❌ 识别失败: ' + error.message, true);
      setTimeout(() => {
        ipcRenderer.send('close-screenshot');
      }, 2000);
    }
  }, 100);
}

// 显示结果
function showResult(message, isError = false, customClass = '') {
  resultDiv.innerHTML = message;
  resultDiv.className = '';
  if (isError) {
    resultDiv.classList.add('error');
  } else if (customClass) {
    resultDiv.classList.add(customClass);
  }
  resultDiv.style.display = 'block';
}

// ESC 键取消
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ipcRenderer.send('close-screenshot');
  }
});
