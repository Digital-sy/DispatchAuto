const { listShipmentPlans } = require('../api/lingxing/shipment_plan');
const feishu = require('../api/feishu/webhook');
const logger = require('../utils/logger');

// 简单内存去重，生产环境建议换成持久化存储（SQLite/Redis）
const handledSeqs = new Set();

/**
 * 检测领星中状态为"待处理"(status=5)且未被处理过的发货计划
 * @returns {Array} 新计划列表
 */
async function run() {
  const plans = await listShipmentPlans({ status: '5' });
  const newPlans = [];

  for (const group of plans) {
    const seq = group.seq;
    if (handledSeqs.has(seq)) continue;

    handledSeqs.add(seq);
    logger.info(seq, '检测到新发货计划');

    const skuList = group.list || [];
    await feishu.notifyNewPlan(seq, skuList);

    newPlans.push({ seq, group, skuList });
  }

  return newPlans;
}

module.exports = { run };
