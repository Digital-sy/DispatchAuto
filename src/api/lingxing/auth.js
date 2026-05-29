const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config');

let _token = null;
let _refreshToken = null;
let _tokenExpiry = 0;
let _lastCallTime = 0;
const MIN_INTERVAL_MS = 1100;

// ─── 签名算法（对应 Python 版 SignBase.generate_sign）───────────────

/**
 * 将请求参数按 key 排序拼成 canonical querystring
 * 空值跳过，dict/array 用 JSON 序列化（key 有序）
 */
function formatParams(params) {
  const sortedKeys = Object.keys(params).sort();
  const parts = [];
  for (const k of sortedKeys) {
    const v = params[k];
    if (v === '' || v === null || v === undefined) continue;
    if (typeof v === 'object') {
      // 保持 key 有序的 JSON 序列化
      parts.push(`${k}=${JSON.stringify(v, Object.keys(v).sort())}`);
    } else {
      parts.push(`${k}=${v}`);
    }
  }
  return parts.join('&');
}

/**
 * AES-ECB 加密，PKCS7 padding，返回 Base64
 */
function aesEncrypt(key, data) {
  // key 必须是 16/24/32 字节，appId 不足时右补空格
  const keyBuf = Buffer.alloc(16);
  Buffer.from(key, 'utf8').copy(keyBuf);

  // PKCS7 padding
  const blockSize = 16;
  const padLen = blockSize - (data.length % blockSize);
  const padded = Buffer.alloc(data.length + padLen);
  Buffer.from(data, 'utf8').copy(padded);
  padded.fill(padLen, data.length);

  const cipher = crypto.createCipheriv('aes-128-ecb', keyBuf, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(padded), cipher.final()]).toString('base64');
}

/**
 * 生成签名
 * 1. 合并所有参数（body + query + sign基础参数）
 * 2. 排序拼接
 * 3. MD5 转大写
 * 4. AES-ECB 加密（key=appId）
 * 5. Base64
 */
function generateSign(appId, allParams) {
  const canonical = formatParams(allParams);
  const md5Upper = crypto.createHash('md5').update(canonical).digest('hex').toUpperCase();
  return aesEncrypt(appId, md5Upper);
}

// ─── Token 管理 ──────────────────────────────────────────────────────

async function getToken() {
  if (_token && Date.now() < _tokenExpiry - 60 * 1000) {
    return _token;
  }

  // 优先用 refresh_token 续期，失败则重新获取
  try {
    if (_refreshToken) {
      const res = await axios.post(
        `${config.lingxing.baseUrl}/api/auth-server/oauth/refresh`,
        `appId=${encodeURIComponent(config.lingxing.appKey)}&refreshToken=${encodeURIComponent(_refreshToken)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      if (res.data.code === 200) {
        _token = res.data.data.access_token;
        _refreshToken = res.data.data.refresh_token;
        _tokenExpiry = Date.now() + res.data.data.expires_in * 1000;
        return _token;
      }
    }
  } catch (_) { /* 续期失败，走重新获取 */ }

  // 重新获取
  const res = await axios.post(
    `${config.lingxing.baseUrl}/api/auth-server/oauth/access-token`,
    `appId=${encodeURIComponent(config.lingxing.appKey)}&appSecret=${encodeURIComponent(config.lingxing.appSecret)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  if (res.data.code !== 200) {
    throw new Error(`Token获取失败: code=${res.data.code} msg=${res.data.message || res.data.msg}`);
  }
  _token = res.data.data.access_token;
  _refreshToken = res.data.data.refresh_token;
  _tokenExpiry = Date.now() + res.data.data.expires_in * 1000;
  return _token;
}

// ─── 统一请求入口 ─────────────────────────────────────────────────────

async function request(path, body = {}) {
  // 节流
  const elapsed = Date.now() - _lastCallTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise(r => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  _lastCallTime = Date.now();

  const token = await getToken();
  const timestamp = `${Math.floor(Date.now() / 1000)}`;

  const signBaseParams = {
    app_key: config.lingxing.appKey,
    access_token: token,
    timestamp,
  };

  // 合并 body + signBaseParams 用于生成签名
  const allParams = { ...body, ...signBaseParams };
  const sign = generateSign(config.lingxing.appKey, allParams);

  const res = await axios.post(
    `${config.lingxing.baseUrl}${path}`,
    body,
    {
      params: { ...signBaseParams, sign },
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (res.data.code !== 0) {
    throw new Error(`领星API错误 [${path}]: code=${res.data.code} msg=${res.data.message || res.data.msg}`);
  }
  return res.data;
}

module.exports = { request };
