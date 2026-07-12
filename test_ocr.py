"""
SiliconFlow DeepSeek-OCR 测试脚本
==============================
使用硅基流动 API 调用 deepseek-ai/DeepSeek-OCR 模型，
识别图片中的文字并输出。

用法:
    python test_ocr.py <图片路径>

示例:
    python test_ocr.py test_chinese_text.png
    python test_ocr.py screenshot.jpg
"""
import base64
import json
import sys
import os
import urllib.request
import urllib.error

# ========== 配置 ==========
# 密钥从环境变量读取，避免泄露到 GitHub
# 用法: SILICONFLOW_API_KEY=sk-xxx python test_ocr.py 图片.png
API_KEY = os.environ.get("SILICONFLOW_API_KEY", "")
BASE_URL = "https://api.siliconflow.cn/v1/chat/completions"
MODEL = "deepseek-ai/DeepSeek-OCR"

if not API_KEY:
    print("❌ 请设置环境变量 SILICONFLOW_API_KEY")
    print("   Windows: set SILICONFLOW_API_KEY=sk-xxx && python test_ocr.py 图片.png")
    print("   或复制 .env 中的 SILICONFLOW_API_KEY 值")
    sys.exit(1)
# =========================


def image_to_base64(image_path: str) -> str:
    """将图片文件转换为 base64 data URL"""
    with open(image_path, "rb") as f:
        img_data = f.read()

    # 推断 MIME 类型
    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
    }
    mime = mime_map.get(ext, "image/png")

    b64 = base64.b64encode(img_data).decode("utf-8")
    return f"data:{mime};base64,{b64}"


def ocr_image(image_path: str) -> dict:
    """
    调用 SiliconFlow DeepSeek-OCR 识别图片文字。

    返回:
        {
            "success": True/False,
            "text": "识别出的文字内容",
            "raw_response": {...}  # 完整 API 响应
        }
    """
    print(f"📷 读取图片: {image_path}")

    if not os.path.exists(image_path):
        return {"success": False, "text": "", "error": f"文件不存在: {image_path}"}

    file_size = os.path.getsize(image_path)
    print(f"   文件大小: {file_size / 1024:.1f} KB")

    # 图片转 base64
    print("🔄 转换为 base64 ...")
    try:
        img_b64 = image_to_base64(image_path)
    except Exception as e:
        return {"success": False, "text": "", "error": f"base64 转换失败: {e}"}

    # 构造请求体 (OpenAI 兼容格式)
    # CRITICAL: system prompt 是必须的，否则模型可能输出乱码或空内容
    request_body = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an OCR engine. Output ONLY the text from the image directly. "
                    "No JSON, no markdown, no explanation. Output the text exactly as it appears."
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": img_b64},
                    },
                    {
                        "type": "text",
                        "text": "请提取图片中的所有文字。",
                    },
                ],
            },
        ],
        "temperature": 0.1,
        "max_tokens": 4096,
        "stream": False,
    }

    # 发送请求
    print("🚀 调用 SiliconFlow DeepSeek-OCR ...")
    req = urllib.request.Request(
        BASE_URL,
        data=json.dumps(request_body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else ""
        return {
            "success": False,
            "text": "",
            "error": f"HTTP {e.code}: {error_body}",
        }
    except Exception as e:
        return {"success": False, "text": "", "error": f"请求失败: {e}"}

    # 提取文字
    text = ""
    choices = raw.get("choices", [])
    if choices:
        text = choices[0].get("message", {}).get("content", "")

    usage = raw.get("usage", {})
    print(f"   Tokens: {usage.get('total_tokens', '?')} "
          f"(prompt: {usage.get('prompt_tokens', '?')}, "
          f"completion: {usage.get('completion_tokens', '?')})")

    return {
        "success": True,
        "text": text,
        "raw_response": raw,
    }


def main():
    if len(sys.argv) < 2:
        print("用法: python test_ocr.py <图片路径>")
        print("示例: python test_ocr.py test_chinese_text.png")
        sys.exit(1)

    image_path = sys.argv[1]
    result = ocr_image(image_path)

    print()
    print("=" * 60)

    if result["success"]:
        text = result["text"]
        if text:
            print("✅ OCR 识别成功！\n")
            print("📝 识别结果:")
            print("-" * 40)
            print(text)
            print("-" * 40)
        else:
            print("⚠️  API 返回成功但文字为空（图片可能不含可识别文字）")
    else:
        print(f"❌ OCR 识别失败")
        print(f"   错误: {result.get('error', '未知错误')}")

    print("=" * 60)


if __name__ == "__main__":
    main()
