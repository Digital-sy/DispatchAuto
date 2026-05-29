const { request } = require('./auth');

async function listShipmentPlans(params = {}) {
  const res = await request('/erp/sc/data/fba_report/shipmentPlanLists', {
    offset: 0,
    length: 50,
    ...params,
  });
  return res.data || [];
}

async function createShipmentPlan(productList, remark = '') {
  const res = await request('/erp/sc/routing/storage/shipment/createShipmentPlan', {
    remark,
    product_list: productList,
  });
  // 返回 { seq, order_sn: [] }
  return res.data;
}

async function updateShipmentPlan(orderSn, params = {}) {
  await request('/erp/sc/routing/storage/shipment/updateShipmentPlan', {
    order_sn: orderSn,
    ...params,
  });
}

module.exports = { listShipmentPlans, createShipmentPlan, updateShipmentPlan };
