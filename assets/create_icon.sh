#!/bin/bash
# 使用 ImageMagick 或其他工具将 SVG 转换为 PNG
# 这里创建一个简单的占位图标
convert -size 256x256 xc:none -fill "#667eea" -draw "roundrectangle 0,0,256,256,40,40" \
        -fill white -draw "rectangle 48,48,208,208" \
        -fill "#667eea" -draw "rectangle 64,64,112,112 rectangle 72,72,104,104" \
        -fill white -draw "rectangle 80,80,96,96" \
        -fill "#667eea" -draw "rectangle 144,64,192,112 rectangle 64,144,112,192" \
        icon.png 2>/dev/null || \
# 如果 ImageMagick 不可用，使用备用方案
echo "请手动添加 icon.png 文件到 assets 目录"
