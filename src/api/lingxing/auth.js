const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config');

let _token = null;
let _tokenExpiry = 0;
let _lastCallTime = 0;
const MIN_INTERVAL_MS = 1100; // 令牌桶容量1，保留100ms余量

async function getToken() {
  if (_token && Date.now() < _tokenExpiry - 10 * 60 * 1000) {
    return _token;
  }
  const res = await axios.post(
    `${config.lingxing.baseUrl}/api/auth-server/oauth/access-token`,
    { appId: config.lingxing.appKey, appSecret: config.lingxing.appSecret }
  );
  if (res.data.code !== 200) throw new Error(`Token获取失败: ${res.data.message}`);
  _token = res.data.data.access_token;
  _tokenExpiry = Date.now() + res.data.data.expires_in * 1000;
  return _token;
}

function makeSign(appKey, timestamp, token) {
  return crypto
    .createHash('md5')
    .update(appKey + timestamp + token)
    .digest('hex');
}

async function request(path, body = {}) {
  // 节流：保证调用间隔 ≥ 1.1s
  const now = Date.now();
  const elapsed = now - _lastCallTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise(r => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  _lastCallTime = Date.now();

  const token = await getToken();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const sign = makeSign(config.lingxing.appKey, timestamp, token);

  const res = await axios.post(
    `${config.lingxing.baseUrl}${path}`,
    body,
    {
      params: {
        access_token: token,
        timestamp,
        sign,
        app_key: config.lingxing.appKey,
      },
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (res.data.code !== 0) {
    throw new Error(`领星API错误 [${path}]: code=${res.data.code} msg=${res.data.message}`);
  }
  return res.data;
}

module.exports = { request };
