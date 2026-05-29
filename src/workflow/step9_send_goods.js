const { sendGoods } = require('../api/lingxing/shipment_order');
const logger = require('../utils/logger');

async function run(seq, orderSn, shipmentIds) {
  logger.info(seq, '触发发货，扣减库存', { orderSn });
  await sendGoods([orderSn]);
  logger.info(seq, '发货成功', { orderSn, shipmentIds });
}

module.exports = { run };
