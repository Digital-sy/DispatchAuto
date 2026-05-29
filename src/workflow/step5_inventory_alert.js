const { poll } = require('../utils/poller');
const feishu = require('../api/feishu/webhook');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 库存不足时通知运营，等待人工决策
 * 决策结果写入 decisionStore（生产环境替换为 HTTP callback）
 * @returns {'adjust' | 'cancel'}
 */
const decisionStore = {};

function receiveDecision(seq, decision) {
  decisionStore[seq] = decision;
}

async function run(seq, shortItems) {
  logger.warn(seq, '库存不足，等待运营决策', { shortItems });
  await feishu.alertInventoryShort(seq, shortItems);

  const timeoutMs = config.poll.planConfirmTimeoutH * 60 * 60 * 1000;

  const decision = await poll(
    async () => {
      if (decisionStore[seq]) return { done: true, result: decisionStore[seq] };
      return { done: false };
    },
    { intervalMs: 30000, timeoutMs, seq, label: '运营库存决策' }
  );

  logger.info(seq, `运营决策：${decision}`);
  return decision;
}

module.exports = { run, receiveDecision };
