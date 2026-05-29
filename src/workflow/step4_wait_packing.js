const { poll } = require('../utils/poller');
const { updateShipmentPlan } = require('../api/lingxing/shipment_plan');
const feishu = require('../api/feishu/webhook');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 等待仓库通过表单回传装箱数据
 * 当前实现：轮询一个共享状态对象（生产环境替换为 HTTP callback 或飞书表单 webhook）
 *
 * packingStore 结构：{ [seq]: { boxes: [...], receivedAt: timestamp } }
 */
const packingStore = {};

/** 由仓库回传接口调用，写入装箱数据 */
function receivePackingData(seq, data) {
  packingStore[seq] = { ...data, receivedAt: Date.now() };
}

async function run(plan) {
  const { seq, skuList } = plan;
  const timeoutMs = config.poll.packingWaitTimeoutH * 60 * 60 * 1000;

  logger.info(seq, '等待仓库装箱数据回传');

  const packingData = await poll(
    async () => {
      if (packingStore[seq]) return { done: true, result: packingStore[seq] };
      return { done: false };
    },
    { intervalMs: 60000, timeoutMs, seq, label: '仓库装箱数据' }
  );

  // 回填箱规到领星发货计划
  for (const item of skuList) {
    const box = packingData.boxes?.find(b => b.sku === item.sku) || packingData.boxes?.[0];
    if (!box) continue;
    await updateShipmentPlan(item.order_sn, {
      cg_box_length: box.length,
      cg_box_width: box.width,
      cg_box_height: box.height,
      cg_box_weight: box.weight,
      box_num: box.boxNum,
      quantity_in_case: box.quantityInCase,
    });
    logger.info(seq, '装箱数据已回填', { sku: item.sku });
  }

  return packingData;
}

module.exports = { run, receivePackingData };
