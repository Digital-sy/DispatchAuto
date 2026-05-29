const { listShipmentPlans } = require('../api/lingxing/shipment_plan');
const feishu = require('../api/feishu/webhook');
const logger = require('../utils/logger');

// 内存去重，防止重复触发（生产环境换成持久化存储）
const handledSeqs = new Set();

/**
 * 检测领星中状态为"待处理"(status=5)且未被处理过的发货计划
 * 通知对象取发货计划的 create_user（运营负责人）
 * @returns {Array} 新计划列表
 */
async function run() {
  const plans = await listShipmentPlans({ status: '5' });
  const newPlans = [];

  for (const group of plans) {
    const seq = group.seq;
    if (handledSeqs.has(seq)) continue;

    handledSeqs.add(seq);

    const skuList = group.list || [];
    // 运营负责人取批次级别的 create_user，不存在则取第一个 SKU 的 create_user
    const opsName = group.create_user || skuList[0]?.create_user || '';

    logger.info(seq, '检测到新发货计划', { opsName, skuCount: skuList.length });

    await feishu.notifyNewPlan(opsName, seq, skuList);

    newPlans.push({ seq, group, skuList, opsName });
  }

  return newPlans;
}

module.exports = { run };
