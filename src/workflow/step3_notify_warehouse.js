const feishu = require('../api/feishu/webhook');
const logger = require('../utils/logger');

async function run(plan) {
  const { seq, skuList, group } = plan;
  const wname = skuList[0]?.wname || '仓库';
  logger.info(seq, '通知仓库盘点');
  await feishu.notifyWarehouse(seq, skuList, wname);
}

module.exports = { run };
