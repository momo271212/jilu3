/**
 * SiliconFlow DeepSeek-OCR 测试脚本 (Node.js)
 * ===========================================
 * 用法: node test_ocr.js <图片路径>
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

// 密钥从环境变量读取，避免泄露到 GitHub
// 用法: SILICONFLOW_API_KEY=sk-xxx node test_ocr.js 图片.png
const API_KEY = process.env.SILICONFLOW_API_KEY || '';
const BASE_URL = 'https://api.siliconflow.cn';

if (!API_KEY) {
  console.error('❌ 请设置环境变量 SILICONFLOW_API_KEY');
  console.error('   Windows: set SILICONFLOW_API_KEY=sk-xxx && node test_ocr.js 图片.png');
  console.error('   或复制 .env 中的 SILICONFLOW_API_KEY 值');
  process.exit(1);
}

async function ocrImage(imagePath) {
  console.log(`📷 读取图片: ${imagePath}`);

  if (!fs.existsSync(imagePath)) {
    console.error(`❌ 文件不存在: ${imagePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(imagePath);
  console.log(`   文件大小: ${(stat.size / 1024).toFixed(1)} KB`);

  // 推断 MIME
  const ext = path.extname(imagePath).toLowerCase();
  const mimeMap = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' };
  const mime = mimeMap[ext] || 'image/png';

  // 转 base64
  console.log('🔄 转换为 base64 ...');
  const imgBuffer = fs.readFileSync(imagePath);
  const b64 = imgBuffer.toString('base64');
  const imgUrl = `data:${mime};base64,${b64}`;

  // 构造请求
  const body = JSON.stringify({
    model: 'deepseek-ai/DeepSeek-OCR',
    messages: [
      {
        role: 'system',
        content: 'You are an OCR engine. Output ONLY the text from the image directly. No JSON, no markdown, no explanation. Output the text exactly as it appears.',
      },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imgUrl } },
          { type: 'text', text: '请提取图片中的所有文字。' },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 4096,
    stream: false,
  });

  console.log('🚀 调用 SiliconFlow DeepSeek-OCR ...');

  return new Promise((resolve, reject) => {
    const url = new URL('/v1/chat/completions', BASE_URL);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 120000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const raw = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(raw).slice(0, 300)}`));
          } else {
            const text = raw.choices?.[0]?.message?.content || '';
            const usage = raw.usage || {};
            console.log(`   Tokens: ${usage.total_tokens || '?'} (prompt: ${usage.prompt_tokens || '?'}, completion: ${usage.completion_tokens || '?'})`);
            resolve({ text, raw });
          }
        } catch (e) {
          reject(new Error(`解析响应失败: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', e => reject(new Error(`网络错误: ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.log('用法: node test_ocr.js <图片路径>');
    console.log('示例: node test_ocr.js screenshot.png');
    process.exit(1);
  }

  try {
    const result = await ocrImage(imagePath);
    console.log('\n' + '='.repeat(60));
    if (result.text) {
      console.log('✅ OCR 识别成功！\n');
      console.log('📝 识别结果:');
      console.log('-'.repeat(40));
      console.log(result.text);
      console.log('-'.repeat(40));
    } else {
      console.log('⚠️  API 返回成功但文字为空');
    }
    console.log('='.repeat(60));
  } catch (err) {
    console.log('\n' + '='.repeat(60));
    console.log(`❌ OCR 失败: ${err.message}`);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

main();
