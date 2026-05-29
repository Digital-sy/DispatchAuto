const { listShipmentPlans } = require('../api/lingxing/shipment_plan');
const feishu = require('../api/feishu/webhook');
const logger = require('../utils/logger');

// 内存去重，防止重复触发（生产环境换成持久化存储）
const handledSeqs = new Set();

/**
 * 获取今天的日期字符串，格式 YYYY-MM-DD（北京时间）
 */
function getTodayCST() {
  const now = new Date();
  // 转换为北京时间 UTC+8
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().slice(0, 10);
}

/**
 * 检测领星中今天创建、状态为"待处理"(status=5)且未被处理过的发货计划
 * 通知对象取发货计划的 create_user（运营负责人）
 * @returns {Array} 新计划列表
 */
async function run() {
  const today = getTodayCST();
  const plans = await listShipmentPlans({
    status: '5',
    search_field_time: 'gmt_create',
    start_date: today,
    end_date: today,
  });
  const newPlans = [];

  for (const group of plans) {
    const seq = group.seq;
    if (handledSeqs.has(seq)) continue;

    handledSeqs.add(seq);

    const skuList = group.list || [];
    const opsName = group.create_user || skuList[0]?.create_user || '';

    logger.info(seq, '检测到新发货计划', { opsName, skuCount: skuList.length, date: today });

    await feishu.notifyNewPlan(opsName, seq, skuList);

    newPlans.push({ seq, group, skuList, opsName });
  }

  return newPlans;
}

module.exports = { run };
