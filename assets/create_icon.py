#!/usr/bin/env python3
import struct
import zlib
import math

def create_qr_scanner_icon(width, height, filename):
    """创建一个专业的二维码扫描工具图标"""
    
    # PNG 文件头
    png_header = b'\x89PNG\r\n\x1a\n'
    
    # 创建 IHDR chunk (RGBA)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 6 = RGBA
    ihdr_chunk = create_chunk(b'IHDR', ihdr_data)
    
    # 创建图像数据
    raw_data = bytearray()
    
    center_x, center_y = width // 2, height // 2
    
    for y in range(height):
        raw_data.append(0)  # Filter type
        for x in range(width):
            # 距离中心的距离
            dx = x - center_x
            dy = y - center_y
            dist = math.sqrt(dx*dx + dy*dy)
            
            # 背景渐变色（蓝紫色）
            bg_r = int(100 + (x / width) * 60)
            bg_g = int(120 + (y / height) * 40)
            bg_b = 234
            
            r, g, b, a = bg_r, bg_g, bg_b, 255
            
            # 绘制圆角矩形背景
            corner_radius = 50
            in_rounded_rect = False
            
            if (corner_radius <= x <= width - corner_radius and 
                corner_radius <= y <= height - corner_radius):
                in_rounded_rect = True
            else:
                # 检查四个圆角
                corners = [
                    (corner_radius, corner_radius),
                    (width - corner_radius, corner_radius),
                    (corner_radius, height - corner_radius),
                    (width - corner_radius, height - corner_radius)
                ]
                for cx, cy in corners:
                    if math.sqrt((x-cx)**2 + (y-cy)**2) <= corner_radius:
                        in_rounded_rect = True
                        break
            
            if not in_rounded_rect:
                r, g, b, a = 0, 0, 0, 0  # 透明
            else:
                # 绘制二维码图案（中心白色区域）
                qr_size = 140
                qr_left = center_x - qr_size // 2
                qr_top = center_y - qr_size // 2
                
                if (qr_left <= x <= qr_left + qr_size and 
                    qr_top <= y <= qr_top + qr_size):
                    r, g, b = 255, 255, 255
                    
                    # 绘制二维码的三个定位角
                    corner_size = 40
                    corner_margin = 10
                    
                    # 左上角
                    if (qr_left + corner_margin <= x <= qr_left + corner_margin + corner_size and
                        qr_top + corner_margin <= y <= qr_top + corner_margin + corner_size):
                        if (qr_left + corner_margin + 5 <= x <= qr_left + corner_margin + corner_size - 5 and
                            qr_top + corner_margin + 5 <= y <= qr_top + corner_margin + corner_size - 5):
                            if (qr_left + corner_margin + 12 <= x <= qr_left + corner_margin + corner_size - 12 and
                                qr_top + corner_margin + 12 <= y <= qr_top + corner_margin + corner_size - 12):
                                r, g, b = 255, 255, 255
                            else:
                                r, g, b = 60, 80, 200
                        else:
                            r, g, b = 60, 80, 200
                    
                    # 右上角
                    if (qr_left + qr_size - corner_margin - corner_size <= x <= qr_left + qr_size - corner_margin and
                        qr_top + corner_margin <= y <= qr_top + corner_margin + corner_size):
                        if (qr_left + qr_size - corner_margin - corner_size + 5 <= x <= qr_left + qr_size - corner_margin - 5 and
                            qr_top + corner_margin + 5 <= y <= qr_top + corner_margin + corner_size - 5):
                            if (qr_left + qr_size - corner_margin - corner_size + 12 <= x <= qr_left + qr_size - corner_margin - 12 and
                                qr_top + corner_margin + 12 <= y <= qr_top + corner_margin + corner_size - 12):
                                r, g, b = 255, 255, 255
                            else:
                                r, g, b = 60, 80, 200
                        else:
                            r, g, b = 60, 80, 200
                    
                    # 左下角
                    if (qr_left + corner_margin <= x <= qr_left + corner_margin + corner_size and
                        qr_top + qr_size - corner_margin - corner_size <= y <= qr_top + qr_size - corner_margin):
                        if (qr_left + corner_margin + 5 <= x <= qr_left + corner_margin + corner_size - 5 and
                            qr_top + qr_size - corner_margin - corner_size + 5 <= y <= qr_top + qr_size - corner_margin - 5):
                            if (qr_left + corner_margin + 12 <= x <= qr_left + corner_margin + corner_size - 12 and
                                qr_top + qr_size - corner_margin - corner_size + 12 <= y <= qr_top + qr_size - corner_margin - 12):
                                r, g, b = 255, 255, 255
                            else:
                                r, g, b = 60, 80, 200
                        else:
                            r, g, b = 60, 80, 200
                    
                    # 添加一些随机的二维码点
                    qr_x = x - qr_left
                    qr_y = y - qr_top
                    block_size = 8
                    bx = qr_x // block_size
                    by = qr_y // block_size
                    
                    # 简单的伪随机模式
                    if (bx + by) % 3 == 0 and bx > 6 and by > 6 and bx < 11 and by < 11:
                        if qr_x % block_size < block_size - 1 and qr_y % block_size < block_size - 1:
                            r, g, b = 60, 80, 200
                
                # 绘制扫描线（红色，半透明）
                scan_line_y = center_y + 10
                if abs(y - scan_line_y) <= 2:
                    if qr_left <= x <= qr_left + qr_size:
                        r, g, b = 255, 80, 80
                        a = 220
            
            raw_data.extend([r, g, b, a])
    
    # 压缩图像数据
    compressed_data = zlib.compress(bytes(raw_data), 9)
    idat_chunk = create_chunk(b'IDAT', compressed_data)
    
    # IEND chunk
    iend_chunk = create_chunk(b'IEND', b'')
    
    # 写入文件
    with open(filename, 'wb') as f:
        f.write(png_header)
        f.write(ihdr_chunk)
        f.write(idat_chunk)
        f.write(iend_chunk)
    
    print(f"Created professional QR Scanner icon: {filename}")

def create_chunk(chunk_type, data):
    length = struct.pack('>I', len(data))
    crc = zlib.crc32(chunk_type + data) & 0xffffffff
    crc_bytes = struct.pack('>I', crc)
    return length + chunk_type + data + crc_bytes

if __name__ == '__main__':
    create_qr_scanner_icon(256, 256, 'icon.png')
    print("✓ Icon created successfully!")
    print("  Size: 256x256 PNG with transparency")
    print("  Style: Professional QR code scanner design")
