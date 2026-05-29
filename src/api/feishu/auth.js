const axios = require('axios');

const FEISHU_BASE = 'https://open.feishu.cn/open-apis';
const APP_ID = 'cli_a51d151b8af1d00c';
const APP_SECRET = 'Ol9h4IUd8zYoZSml8S3LhhCqbbn5bSwr';

let _token = null;
let _tokenExpiry = 0;

/**
 * 获取 tenant_access_token，有效期2小时，自动刷新
 */
async function getTenantToken() {
  if (_token && Date.now() < _tokenExpiry - 5 * 60 * 1000) {
    return _token;
  }
  const res = await axios.post(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    app_id: APP_ID,
    app_secret: APP_SECRET,
  });
  if (res.data.code !== 0) {
    throw new Error(`飞书Token获取失败: ${res.data.msg}`);
  }
  _token = res.data.tenant_access_token;
  _tokenExpiry = Date.now() + res.data.expire * 1000;
  return _token;
}

async function feishuRequest(method, path, data = {}) {
  const token = await getTenantToken();
  const res = await axios({
    method,
    url: `${FEISHU_BASE}${path}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data,
  });
  if (res.data.code !== 0) {
    throw new Error(`飞书API错误 [${path}]: ${res.data.msg}`);
  }
  return res.data;
}

module.exports = { getTenantToken, feishuRequest, FEISHU_BASE };
