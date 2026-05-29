const { feishuRequest } = require('./auth');

const APP_TOKEN = 'QYQTb0gWxaRAARsTpMYcvzxAnjh';
const TABLE_ID = 'tbl6IdXqiWv8Veoq';
const FIELD_NAME = '人员';

/**
 * 从多维表查询所有人员的 user_id
 * 多维表"人员"字段返回结构：[{ id, name, avatar_url, ... }]
 * @returns {Array<{ name: string, user_id: string }>}
 */
async function getAllUsers() {
  const res = await feishuRequest(
    'GET',
    `/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=100`
  );
  const records = res.data?.items || [];
  const users = [];

  for (const record of records) {
    const field = record.fields?.[FIELD_NAME];
    if (!field) continue;
    // 人员字段是数组
    const people = Array.isArray(field) ? field : [field];
    for (const person of people) {
      if (person?.id) {
        users.push({ name: person.name || '', user_id: person.id });
      }
    }
  }

  // 去重（同一人可能出现在多条记录）
  const seen = new Set();
  return users.filter(u => {
    if (seen.has(u.user_id)) return false;
    seen.add(u.user_id);
    return true;
  });
}

/**
 * 通过姓名查 user_id
 * @param {string} name
 */
async function getUserIdByName(name) {
  const users = await getAllUsers();
  return users.find(u => u.name === name)?.user_id || null;
}

module.exports = { getAllUsers, getUserIdByName };
