const cron = require('node-cron');
const config = require('../config');
const logger = require('../utils/logger');
const feishu = require('../api/feishu/webhook');

const step1 = require('./step1_detect_plan');
const step2 = require('./step2_check_inventory');
const step3 = require('./step3_notify_warehouse');
const step4 = require('./step4_wait_packing');
const step5 = require('./step5_inventory_alert');
const step6 = require('./step6_create_sta');
const step7 = require('./step7_confirm_plan');
const step8 = require('./step8_sync_shipment');
const step9 = require('./step9_send_goods');

// 正在处理中的批次号，防止重复触发
const processing = new Set();

async function runPipeline(plan) {
  const seq = plan.seq;
  if (processing.has(seq)) return;
  processing.add(seq);
  logger.info(seq, '流程开始');

  let shipmentSn = null;
  try {
    // Step 2: 库存校验
    const { passed, shortItems } = await step2.run(plan);
    if (!passed) {
      // Step 5: 库存不足，通知运营介入
      const decision = await step5.run(seq, shortItems);
      if (decision === 'cancel') {
        logger.info(seq, '运营取消本次发货，流程结束');
        return;
      }
      // decision === 'adjust'，运营已调整数量，继续
    }

    // Step 3: 通知仓库盘点
    await step3.run(plan);

    // Step 4: 等待仓库装箱数据回传
    const packingData = await step4.run(plan);

    // Step 6: 创建STA货件
    const staResult = await step6.run(plan, packingData);

    // Step 7: 运营确认分仓方案
    const confirmedPlan = await step7.run(seq, staResult);

    // Step 8: 同步货件号，生成发货单
    const { orderSn, shipmentIds } = await step8.run(seq, confirmedPlan);
    shipmentSn = orderSn;

    // Step 9: 发货
    await step9.run(seq, orderSn, shipmentIds);

    logger.info(seq, '流程完成', { orderSn, shipmentIds });
    await feishu.notifyComplete(seq, orderSn, shipmentIds);
  } catch (err) {
    logger.error(seq, '流程异常，触发回滚', { error: err.message });
    await feishu.alertError(seq, '自动回滚', err.message);
    if (shipmentSn) {
      try {
        const { invalidShipment } = require('../api/lingxing/shipment_order');
        await invalidShipment([shipmentSn], `自动回滚: ${err.message}`);
        logger.info(seq, '发货单已作废，库存已恢复');
      } catch (rollbackErr) {
        logger.error(seq, '回滚失败，请人工处理', { error: rollbackErr.message });
        await feishu.alertError(seq, '回滚失败，需人工处理', rollbackErr.message);
      }
    }
  } finally {
    processing.delete(seq);
  }
}

async function tick() {
  try {
    const newPlans = await step1.run();
    for (const plan of newPlans) {
      runPipeline(plan); // 不 await，允许多批次并发
    }
  } catch (err) {
    logger.error('', '主调度异常', { error: err.message });
  }
}

logger.info('', `DispatchAuto 启动，轮询周期: ${config.poll.intervalCron}`);
cron.schedule(config.poll.intervalCron, tick);
tick(); // 启动时立即执行一次
