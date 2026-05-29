const axios = require('axios');
const config = require('../../config');

async function send(payload) {
  await axios.post(config.feishu.webhookUrl, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
}

function sendText(text) {
  return send({ msg_type: 'text', content: { text } });
}

function sendCard(card) {
  return send({ msg_type: 'interactive', card });
}

// ─── 预置消息模板 ───────────────────────────────

function notifyNewPlan(seq, skuList) {
  const skuLines = skuList.map(s => `• ${s.msku}  数量：${s.shipment_plan_quantity}`).join('\n');
  return sendText(`【DispatchAuto】检测到新发货计划\n批次号：${seq}\n${skuLines}`);
}

function notifyWarehouse(seq, skuList, wname) {
  const skuLines = skuList.map(s => `• ${s.msku}  计划量：${s.shipment_plan_quantity}`).join('\n');
  return sendText(`【DispatchAuto】请盘点以下SKU\n批次号：${seq}  仓库：${wname}\n${skuLines}\n\n请在系统表单填写实际装箱数据。`);
}

function alertInventoryShort(seq, items) {
  const lines = items.map(i =>
    `• ${i.msku}  计划：${i.planQty}  可用：${i.availQty}  差额：${i.planQty - i.availQty}`
  ).join('\n');
  return sendText(`【DispatchAuto ⚠️】库存不足，请运营确认\n批次号：${seq}\n${lines}\n\n请在系统中选择：减量继续 或 取消发货。`);
}

function notifyShipmentPlanOptions(seq, plans) {
  const lines = plans.map((p, i) =>
    `方案${i + 1}：${p.description || JSON.stringify(p)}`
  ).join('\n');
  return sendText(`【DispatchAuto】请确认分仓方案\n批次号：${seq}\n${lines}\n\n请在系统中选择方案后继续。`);
}

function notifyComplete(seq, shipmentSn, shipmentIds) {
  return sendText(
    `【DispatchAuto ✅】发货完成\n批次号：${seq}\n发货单号：${shipmentSn}\n货件号：${shipmentIds.join(', ')}`
  );
}

function alertError(seq, step, errMsg) {
  return sendText(`【DispatchAuto ❌】流程异常，已自动回滚\n批次号：${seq}\n步骤：${step}\n错误：${errMsg}`);
}

module.exports = {
  sendText,
  sendCard,
  notifyNewPlan,
  notifyWarehouse,
  alertInventoryShort,
  notifyShipmentPlanOptions,
  notifyComplete,
  alertError,
};
