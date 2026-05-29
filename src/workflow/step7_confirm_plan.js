const { poll } = require('../utils/poller');
const sta = require('../api/lingxing/sta');
const feishu = require('../api/feishu/webhook');
const config = require('../config');
const logger = require('../utils/logger');

const confirmStore = {};

function receiveConfirmation(seq, selectedPlanId) {
  confirmStore[seq] = selectedPlanId;
}

/**
 * 推送分仓方案给运营，等待选择后确认
 */
async function run(seq, { staTaskId, preview }) {
  const plans = preview?.shipment_plans || [preview];
  logger.info(seq, '推送分仓方案给运营', { planCount: plans.length });
  await feishu.notifyShipmentPlanOptions(seq, plans);

  const timeoutMs = config.poll.planConfirmTimeoutH * 60 * 60 * 1000;

  const selectedPlanId = await poll(
    async () => {
      if (confirmStore[seq]) return { done: true, result: confirmStore[seq] };
      return { done: false };
    },
    { intervalMs: 30000, timeoutMs, seq, label: '运营分仓确认' }
  );

  logger.info(seq, 'STA: 确认货件方案', { selectedPlanId });
  await sta.confirmShipmentPlan({ sta_task_id: staTaskId, plan_id: selectedPlanId });

  return { staTaskId, selectedPlanId };
}

module.exports = { run, receiveConfirmation };
