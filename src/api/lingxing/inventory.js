const { request } = require('./auth');

/**
 * 查询本地仓库库存明细
 * @param {string} sku
 * @param {string|number} wid - 仓库id
 * @returns {object} 库存数据，含 product_valid_num
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

module.exports = { getInventory };
