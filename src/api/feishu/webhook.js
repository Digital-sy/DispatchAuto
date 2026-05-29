const axios = require('axios');
const { getTenantToken } = require('./auth');
const { getOpenIdByName } = require('./bitable');
const logger = require('../../utils/logger');
const config = require('../../config');

const FEISHU_BASE = 'https://open.feishu.cn/open-apis';

/**
 * 发送文本消息给指定 open_id
 */
async function sendText(openId, text) {
  const token = await getTenantToken();
  const res = await axios.post(
    `${FEISHU_BASE}/im/v1/messages`,
    {
      receive_id: openId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
    {
      params: { receive_id_type: 'open_id' },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (res.data.code !== 0) {
    throw new Error(`飞书发消息失败: code=${res.data.code} msg=${res.data.msg}`);
  }
}

/**
 * 通过姓名查 open_id 后发消息
 * 测试模式下强制发给 TEST_RECEIVER
 */
async function sendTextByName(name, text) {
  // 测试模式：所有消息重定向到测试接收人
  const targetName = config.feishu.testMode ? config.feishu.testReceiver : name;
  if (config.feishu.testMode && name !== targetName) {
    logger.info('', `[测试模式] 消息重定向: ${name} → ${targetName}`);
  }

  try {
    const openId = await getOpenIdByName(targetName);
    if (!openId) {
      logger.warn('', `找不到用户 ${targetName} 的 open_id，消息未发送`);
      return;
    }
    await sendText(openId, text);
  } catch (err) {
    logger.warn('', `飞书消息发送失败（${targetName}）`, { error: err.message });
  }
}

// ─── 预置消息模板 ────────────────────────────────────────────────────
// name 传实际负责人姓名，测试模式下自动重定向

function notifyNewPlan(name, seq, skuList) {
  const skuLines = (skuList || []).map(s => `• ${s.msku}  数量：${s.shipment_plan_quantity}`).join('\n');
  return sendTextByName(name, `【DispatchAuto】检测到新发货计划\n批次号：${seq}\n创建人：${name}\n${skuLines}`);
}

function notifyWarehouse(name, seq, skuList, wname) {
  const skuLines = (skuList || []).map(s => `• ${s.msku}  计划量：${s.shipment_plan_quantity}`).join('\n');
  return sendTextByName(
    name,
    `【DispatchAuto】请盘点以下SKU\n批次号：${seq}  仓库：${wname}\n${skuLines}\n\n请填写实际装箱数据后回传。`
  );
}

function alertInventoryShort(name, seq, items) {
  const lines = (items || []).map(i =>
    `• ${i.msku}  计划：${i.planQty}  可用：${i.availQty}  差额：${i.planQty - i.availQty}`
  ).join('\n');
  return sendTextByName(
    name,
    `【DispatchAuto ⚠️】库存不足，请确认\n批次号：${seq}\n${lines}\n\n请回复：减量继续 或 取消发货`
  );
}

function notifyShipmentPlanOptions(name, seq, plans) {
  const lines = (plans || []).map((p, i) =>
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
    `【DispatchAuto ✅】发货完成\n批次号：${seq}\n发货单号：${shipmentSn}\n货件号：${(shipmentIds || []).join(', ')}`
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
  sendTextByName,
  notifyNewPlan,
  notifyWarehouse,
  alertInventoryShort,
  notifyShipmentPlanOptions,
  notifyComplete,
  alertError,
};
