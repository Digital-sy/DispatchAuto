const { poll } = require('../utils/poller');
const { listShipmentPlans } = require('../api/lingxing/shipment_plan');
const { createReadySendOrder, pollCreateResult } = require('../api/lingxing/shipment_order');
const { syncShipmentToERP } = require('../api/lingxing/sta');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 1. 主动触发亚马逊货件同步到领星
 * 2. 轮询等待 is_relate_mws=1 且货件号有值
 * 3. 生成发货单
 */
async function run(seq, { staTaskId }) {
  logger.info(seq, '主动触发货件同步');
  await syncShipmentToERP({ sta_task_id: staTaskId });

  logger.info(seq, '轮询等待货件号同步');
  const planWithShipment = await poll(
    async () => {
      const plans = await listShipmentPlans({ search_field: 'order_sn', search_value: seq });
      const group = plans[0];
      if (!group) return { done: false };

      const allRelated = group.list?.every(
        item => item.is_relate_mws === 1 && item.mws_relate?.length > 0
      );
      if (allRelated) return { done: true, result: group };
      return { done: false };
    },
    {
      intervalMs: config.poll.shipmentSyncIntervalS * 1000,
      timeoutMs: config.poll.shipmentSyncRetry * config.poll.shipmentSyncIntervalS * 1000,
      seq,
      label: '货件号同步',
    }
  );

  // 提取货件信息，构建发货单参数
  const items = planWithShipment.list || [];
  const list = items.flatMap(item =>
    (item.mws_relate || []).map(rel => ({
      seller_id: String(item.sid),
      marketplace_id: '', // 需从店铺信息补充
      shipment_id: rel.shipment_mws_sn,
      fulfillment_network_sku: item.fnsku,
      fnsku: item.fnsku,
      num: item.shipment_plan_quantity,
      sku: item.msku,
      box_num: item.box_num,
      cg_box_length: item.cg_box_length,
      cg_box_width: item.cg_box_width,
      cg_box_height: item.cg_box_height,
      cg_box_weight: item.cg_box_weight,
      quantity_in_case: item.quantity_in_case,
    }))
  );

  const shipmentIds = [...new Set(list.map(i => i.shipment_id))];

  logger.info(seq, '生成发货单', { shipmentIds });
  const requestFlag = `dispatchauto_${seq}_${Date.now()}`;
  await createReadySendOrder({
    sys_wid: items[0]?.wid,
    box_type: 'SINGLE',
    list,
    // box_list 按实际装箱数据补充
  });

  const orderSn = await pollCreateResult(requestFlag, seq);
  logger.info(seq, '发货单生成成功', { orderSn });

  return { orderSn, shipmentIds };
}

module.exports = { run };
