const { listShipmentPlans } = require('../api/lingxing/shipment_plan');
const feishu = require('../api/feishu/webhook');
const logger = require('../utils/logger');

const handledSeqs = new Set();
const NOTIFY_NAME = process.env.NOTIFY_OPS_NAME || '';

async function run() {
  const plans = await listShipmentPlans({ status: '5' });
  const newPlans = [];

  for (const group of plans) {
    const seq = group.seq;
    if (handledSeqs.has(seq)) continue;

    handledSeqs.add(seq);
    logger.info(seq, '检测到新发货计划');

    const skuList = group.list || [];
    await feishu.notifyNewPlan(NOTIFY_NAME, seq, skuList);

    newPlans.push({ seq, group, skuList });
  }

  return newPlans;
}

module.exports = { run };
