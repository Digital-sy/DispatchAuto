const sta = require('../api/lingxing/sta');
const logger = require('../utils/logger');

/**
 * 完整 STA 货件创建链路
 * 创建任务 → 保存装箱 → 提交装箱 → 生成货件方案
 * 确认方案在 step7 由运营完成
 */
async function run(plan, packingData) {
  const { seq, skuList, group } = plan;

  logger.info(seq, 'STA: 创建任务');
  const staTask = await sta.createSTATask({
    seq,
    // 根据实际STA接口文档补充必填参数
  });
  const staTaskId = staTask.sta_task_id;

  logger.info(seq, 'STA: 查询包装组');
  const packingGroups = await sta.listPackingGroupItems(staTaskId);

  logger.info(seq, 'STA: 保存装箱信息');
  await sta.savePackingInfo({
    sta_task_id: staTaskId,
    packing_groups: packingGroups,
    packing_data: packingData,
  });

  logger.info(seq, 'STA: 提交装箱信息');
  const submitResult = await sta.submitPackingInfo({ sta_task_id: staTaskId });
  if (submitResult?.task_id) {
    await sta.pollAsyncTask(submitResult.task_id, seq);
  }

  logger.info(seq, 'STA: 生成货件方案');
  const genResult = await sta.generateShipmentPlan({ sta_task_id: staTaskId });
  if (genResult?.task_id) {
    await sta.pollAsyncTask(genResult.task_id, seq);
  }

  logger.info(seq, 'STA: 查询货件方案');
  const preview = await sta.getShipmentPreview({ sta_task_id: staTaskId });

  return { staTaskId, preview };
}

module.exports = { run };
