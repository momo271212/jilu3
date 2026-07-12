"""
生成一张包含中文考研政治知识点的测试图片，
用于测试 SiliconFlow DeepSeek-OCR 识别功能。
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_test_image(output_path="test_chinese_text.png"):
    # 创建白色画布
    img = Image.new('RGB', (800, 250), 'white')
    draw = ImageDraw.Draw(img)

    # 尝试加载中文字体
    font_paths = [
        "C:/Windows/Fonts/simsun.ttc",
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
        "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
        "/System/Library/Fonts/PingFang.ttc",
    ]

    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, 20)
                print(f"使用字体: {fp}")
                break
            except Exception:
                continue

    if font is None:
        print("警告: 未找到中文字体，使用默认字体")
        font = ImageFont.load_default()

    # 考研政治知识点文本
    lines = [
        "矛盾的普遍性是指矛盾存在于一切事物的发展过程中，",
        "即事事有矛盾、时时有矛盾。",
        "",
        "矛盾的特殊性是指不同事物的矛盾各有其特点，",
        "同一事物的矛盾在不同发展过程和阶段各有不同特点。",
        "",
        "唯物辩证法的三大规律：",
        "1. 对立统一规律（矛盾规律）",
        "2. 量变质变规律",
        "3. 否定之否定规律",
    ]

    y = 15
    for line in lines:
        if line:
            draw.text((20, y), line, fill='black', font=font)
        y += 24

    img.save(output_path)
    print(f"测试图片已保存: {output_path}")
    return output_path

if __name__ == "__main__":
    create_test_image()
