#!/usr/bin/env python3
# 创建一个简单但有效的 256x256 PNG 图标

import struct
import zlib

def create_png(width, height, filename):
    # PNG 文件头
    png_header = b'\x89PNG\r\n\x1a\n'
    
    # 创建 IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = create_chunk(b'IHDR', ihdr_data)
    
    # 创建简单的渐变图像数据（紫色渐变）
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type
        for x in range(width):
            # 渐变色（从深紫到浅紫）
            r = int(102 + (x / width) * 50)
            g = int(126 + (y / height) * 50)
            b = int(234)
            raw_data.extend([r, g, b])
    
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

def create_chunk(chunk_type, data):
    length = struct.pack('>I', len(data))
    crc = zlib.crc32(chunk_type + data) & 0xffffffff
    crc_bytes = struct.pack('>I', crc)
    return length + chunk_type + data + crc_bytes

if __name__ == '__main__':
    create_png(256, 256, 'icon_new.png')
    print("Created valid icon_new.png")
