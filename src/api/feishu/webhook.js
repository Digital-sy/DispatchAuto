const { feishuRequest } = require('./auth');
const { getUserIdByName } = require('./bitable');
const logger = require('../../utils/logger');

/**
 * 发送文本消息给指定 user_id
 * @param {string} userId - 飞书 user_id
 * @param {string} text
 */
async function sendText(userId, text) {
  await feishuRequest('POST', '/im/v1/messages?receive_id_type=user_id', {
    receive_id: userId,
    msg_type: 'text',
    content: JSON.stringify({ text }),
  });
}

/**
 * 发送消息卡片给指定 user_id
 * @param {string} userId
 * @param {object} card
 */
async function sendCard(userId, card) {
  await feishuRequest('POST', '/im/v1/messages?receive_id_type=user_id', {
    receive_id: userId,
    msg_type: 'interactive',
    content: JSON.stringify(card),
  });
}

/**
 * 通过姓名查找 user_id 后发送消息
 * 找不到时打印警告但不抛出错误，避免通知失败阻断主流程
 * @param {string} name - 飞书姓名
 * @param {string} text
 */
async function sendTextByName(name, text) {
  try {
    const userId = await getUserIdByName(name);
    if (!userId) {
      logger.warn('', `找不到用户 ${name} 的 user_id，消息未发送`);
      return;
    }
    await sendText(userId, text);
  } catch (err) {
    logger.warn('', `飞书消息发送失败（${name}）`, { error: err.message });
  }
}

// ─── 预置消息模板 ────────────────────────────────
// 接收方统一用 name（姓名），内部自动查 user_id

function notifyNewPlan(name, seq, skuList) {
  const skuLines = skuList.map(s => `• ${s.msku}  数量：${s.shipment_plan_quantity}`).join('\n');
  return sendTextByName(name, `【DispatchAuto】检测到新发货计划\n批次号：${seq}\n${skuLines}`);
}

function notifyWarehouse(name, seq, skuList, wname) {
  const skuLines = skuList.map(s => `• ${s.msku}  计划量：${s.shipment_plan_quantity}`).join('\n');
  return sendTextByName(
    name,
    `【DispatchAuto】请盘点以下SKU\n批次号：${seq}  仓库：${wname}\n${skuLines}\n\n请填写实际装箱数据后回传。`
  );
}

function alertInventoryShort(name, seq, items) {
  const lines = items.map(i =>
    `• ${i.msku}  计划：${i.planQty}  可用：${i.availQty}  差额：${i.planQty - i.availQty}`
  ).join('\n');
  return sendTextByName(
    name,
    `【DispatchAuto ⚠️】库存不足，请确认\n批次号：${seq}\n${lines}\n\n请回复：减量继续 或 取消发货`
  );
}

function notifyShipmentPlanOptions(name, seq, plans) {
  const lines = plans.map((p, i) =>
    `方案${i + 1}：${p.description || JSON.stringify(p)}`
  ).join('\n');
  return sendTextByName(
    name,
    `【DispatchAuto】请确认分仓方案\n批次号：${seq}\n${lines}\n\n请回复方案编号（如：1）继续`
  );
}

function notifyComplete(name, seq, shipmentSn, shipmentIds) {
  return sendTextByName(
    name,
    `【DispatchAuto ✅】发货完成\n批次号：${seq}\n发货单号：${shipmentSn}\n货件号：${shipmentIds.join(', ')}`
  );
}

function alertError(name, seq, step, errMsg) {
  return sendTextByName(
    name,
    `【DispatchAuto ❌】流程异常，已自动回滚\n批次号：${seq}\n步骤：${step}\n错误：${errMsg}`
  );
}

module.exports = {
  sendText,
  sendCard,
  sendTextByName,
  notifyNewPlan,
  notifyWarehouse,
  alertInventoryShort,
  notifyShipmentPlanOptions,
  notifyComplete,
  alertError,
};
