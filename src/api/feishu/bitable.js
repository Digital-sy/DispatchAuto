const axios = require('axios');
const { getTenantToken } = require('./auth');

const APP_TOKEN = 'QYQTb0gWxaRAARsTpMYcvzxAnjh';
const TABLE_ID = 'tbl6IdXqiWv8Veoq';
const FIELD_NAME = '人员';
const FEISHU_BASE = 'https://open.feishu.cn/open-apis';

/**
 * 从多维表拉取所有记录（自动分页）
 * 人员字段结构：[{ id: 'ou_xxx', name: '张三', ... }]
 * @returns {Array<{ name: string, open_id: string }>}
 */
async function getAllUsers() {
  const users = [];
  const seen = new Set();
  let pageToken = null;

  while (true) {
    const token = await getTenantToken();
    const params = { page_size: 100 };
    if (pageToken) params.page_token = pageToken;

    const res = await axios.get(
      `${FEISHU_BASE}/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`,
      {
        params,
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.data.code !== 0) {
      throw new Error(`读取多维表失败: ${res.data.msg}`);
    }

    const data = res.data.data || {};
    const records = data.items || [];

    for (const record of records) {
      const field = record.fields?.[FIELD_NAME];
      if (!field) continue;
      const people = Array.isArray(field) ? field : [field];
      for (const person of people) {
        if (person?.id && person?.name && !seen.has(person.id)) {
          seen.add(person.id);
          users.push({ name: person.name, open_id: person.id });
        }
      }
    }

    if (!data.has_more) break;
    pageToken = data.page_token;
  }

  return users;
}

/**
 * 通过姓名查 open_id
 * @param {string} name
 */
async function getOpenIdByName(name) {
  const users = await getAllUsers();
  return users.find(u => u.name === name)?.open_id || null;
}

module.exports = { getAllUsers, getOpenIdByName };
