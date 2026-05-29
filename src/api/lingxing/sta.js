const { request } = require('./auth');
const { poll } = require('../../utils/poller');

async function createSTATask(params) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/createTask', params);
  return res.data;
}

async function listPackingGroupItems(staTaskId) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/listPackingGroupItems', { sta_task_id: staTaskId });
  return res.data;
}

async function savePackingInfo(params) {
  await request('/erp/sc/routing/storage/shipment/sta/savePackingInfo', params);
}

async function submitPackingInfo(params) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/submitPackingInfo', params);
  return res.data;
}

async function generateShipmentPlan(params) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/generateShipmentPlan', params);
  return res.data;
}

async function getShipmentPreview(params) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/shipmentPreview', params);
  return res.data;
}

async function confirmShipmentPlan(params) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/confirmShipmentPlan', params);
  return res.data;
}

async function generateTransportList(params) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/generateTransportList', params);
  return res.data;
}

async function getTransportList(params) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/getTransportList', params);
  return res.data;
}

async function generateDeliveryDateList(params) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/generateDeliveryDateList', params);
  return res.data;
}

async function getDeliveryDateList(params) {
  const res = await request('/erp/sc/routing/storage/shipment/sta/getDeliveryDateList', params);
  return res.data;
}

async function submitDeliveryTime(params) {
  await request('/erp/sc/routing/storage/shipment/sta/submitDeliveryTime', params);
}

async function submitDistributionService(params) {
  await request('/erp/sc/routing/storage/shipment/sta/submitDistributionService', params);
}

async function syncShipmentToERP(params) {
  await request('/erp/sc/routing/storage/shipment/sta/syncShipment', params);
}

async function cancelSTATask(taskId) {
  await request('/erp/sc/routing/storage/shipment/sta/cancelTask', { sta_task_id: taskId });
}

/**
 * 轮询异步任务状态
 * @param {string} taskId
 * @param {string} seq
 */
async function pollAsyncTask(taskId, seq = '') {
  return poll(
    async () => {
      const res = await request('/erp/sc/routing/storage/shipment/sta/queryAsyncTask', { task_id: taskId });
      const status = res.data?.status;
      // 1=处理中 2=成功 3=失败（以实际文档为准）
      if (status === 2) return { done: true, result: res.data };
      if (status === 3) throw new Error(`STA异步任务失败: ${res.data?.message}`);
      return { done: false };
    },
    { intervalMs: 5000, timeoutMs: 300000, seq, label: 'STA异步任务' }
  );
}

module.exports = {
  createSTATask,
  listPackingGroupItems,
  savePackingInfo,
  submitPackingInfo,
  generateShipmentPlan,
  getShipmentPreview,
  confirmShipmentPlan,
  generateTransportList,
  getTransportList,
  generateDeliveryDateList,
  getDeliveryDateList,
  submitDeliveryTime,
  submitDistributionService,
  syncShipmentToERP,
  cancelSTATask,
  pollAsyncTask,
};
