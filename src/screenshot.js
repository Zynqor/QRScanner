const { ipcRenderer } = require('electron');
const jsQR = require('jsqr');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const hint = document.getElementById('hint');
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

  // 绘制背景图片（半透明遮罩）
  ctx.globalAlpha = 0.3;
  ctx.drawImage(screenshotImage, 0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;

  // 绘制选择框
  if (isDrawing) {
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // 清除选择区域的遮罩
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.3;
    ctx.drawImage(screenshotImage, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;

    // 在选择区域显示原图
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.drawImage(screenshotImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 绘制选择框边框
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // 显示尺寸信息
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.font = '14px Arial';
    ctx.fillText(`${Math.round(width)} x ${Math.round(height)}`, x, y - 5);
  }
}

// 鼠标按下
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  startX = e.clientX;
  startY = e.clientY;
  currentX = e.clientX;
  currentY = e.clientY;
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
    showResult('选择区域太小', true);
    setTimeout(() => {
      ipcRenderer.send('close-screenshot');
    }, 1500);
    return;
  }

  // 从选择区域提取图像数据
  recognizeQRCode(x, y, width, height);
});

// 识别二维码
function recognizeQRCode(x, y, width, height) {
  hint.style.display = 'none';

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
    showResult(`✓ 识别成功: ${code.data}`);
    setTimeout(() => {
      ipcRenderer.send('qr-detected', code.data);
    }, 1000);
  } else {
    showResult('× 未识别到二维码，请重试', true);
    setTimeout(() => {
      ipcRenderer.send('close-screenshot');
    }, 2000);
  }
}

// 显示结果
function showResult(message, isError = false) {
  resultDiv.textContent = message;
  resultDiv.className = isError ? 'error' : '';
  resultDiv.style.display = 'block';
}

// ESC 键取消
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ipcRenderer.send('close-screenshot');
  }
});
