const { request } = require('./auth');

/**
 * 查询本地仓库库存明细
 * 同一 SKU 可能返回多条（按 seller_id / fnsku 分组），取 product_valid_num 最大的一条
 * @param {string} sku
 * @param {string|number} wid
 * @returns {Array}
 */
async function getInventory(sku, wid) {
  const res = await request('/erp/sc/routing/data/local_inventory/inventoryDetails', {
    sku,
    wid: String(wid),
    offset: 0,
    length: 10,
  });
  return res.data || [];
}

/**
 * 获取指定 SKU 在仓库的实际可用量（多条记录取最大值）
 * @param {string} sku
 * @param {string|number} wid
 * @returns {number}
 */
async function getAvailableQty(sku, wid) {
  const records = await getInventory(sku, wid);
  if (!records.length) return 0;
  return records.reduce((sum, r) => sum + (r.product_valid_num || 0), 0);
}

module.exports = { getInventory, getAvailableQty };
