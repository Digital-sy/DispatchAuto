const { getInventory } = require('../api/lingxing/inventory');
const logger = require('../utils/logger');

/**
 * 对计划内每个SKU校验本地库存
 * @returns {{ passed: boolean, shortItems: Array }}
 */
async function run(plan) {
  const { seq, skuList } = plan;
  const shortItems = [];

  for (const item of skuList) {
    const inventoryList = await getInventory(item.sku, item.wid);
    const inv = inventoryList.find(i => i.sku === item.sku);
    const availQty = inv?.product_valid_num || 0;

    logger.info(seq, `库存校验`, { sku: item.sku, planQty: item.shipment_plan_quantity, availQty });

    if (availQty < item.shipment_plan_quantity) {
      shortItems.push({
        msku: item.msku,
        sku: item.sku,
        planQty: item.shipment_plan_quantity,
        availQty,
      });
    }
  }

  return { passed: shortItems.length === 0, shortItems };
}

module.exports = { run };
