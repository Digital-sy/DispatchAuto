const { request } = require('./auth');
const { poll } = require('../../utils/poller');

async function createReadySendOrder(params) {
  const res = await request('/erp/sc/routing/storage/shipment/createReadySendOrder', params);
  return res.data;
}

/**
 * 轮询异步建单结果
 * @param {string} requestFlag
 * @param {string} seq - 日志用批次号
 */
async function pollCreateResult(requestFlag, seq = '') {
  return poll(
    async () => {
      const res = await request('/erp/sc/routing/storage/shipment/searchProcessResult', {
        request_flag: requestFlag,
      });
      const item = res.data?.[0];
      if (!item) return { done: false };
      if (item.process_status === 1) return { done: true, result: item.order_sn };
      if (item.process_status === 2) throw new Error(`建单失败: ${item.process_msg}`);
      return { done: false };
    },
    { intervalMs: 6000, timeoutMs: 120000, seq, label: '建单结果' }
  );
}

async function sendGoods(shipmentNos) {
  await request('/erp/sc/storage/shipment/sendGoods', { shipment_nos: shipmentNos });
}

async function invalidShipment(shipmentNos, reason = '自动回滚') {
  await request('/basicOpen/openapi/fbaShipment/shipmentSn/invalid', {
    shipmentNos,
    isReturnStock: 1,
    isReturnStockAux: 0,
    cancelReason: reason,
  });
}

async function releaseStock(shipmentNos) {
  await request('/erp/sc/routing/storage/shipment/releaseStock', { shipment_nos: shipmentNos });
}

async function getShipmentList(params = {}) {
  const res = await request('/erp/sc/routing/storage/shipment/getInboundShipmentList', {
    offset: 0,
    length: 20,
    ...params,
  });
  return res.data?.list || [];
}

module.exports = {
  createReadySendOrder,
  pollCreateResult,
  sendGoods,
  invalidShipment,
  releaseStock,
  getShipmentList,
};
