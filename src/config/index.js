require('dotenv').config();

module.exports = {
  lingxing: {
    appKey: process.env.LINGXING_APP_KEY,
    appSecret: process.env.LINGXING_APP_SECRET,
    baseUrl: process.env.LINGXING_BASE_URL || 'https://openapi.lingxing.com',
  },
  feishu: {
    testMode: process.env.TEST_MODE === 'true',
    testReceiver: process.env.TEST_RECEIVER || '刘宗霖',
    notifyWarehouseName: process.env.NOTIFY_WAREHOUSE_NAME || '',
  },
  warehouse: {
    defaultWid: process.env.DEFAULT_WID || '10518',
  },
  poll: {
    intervalCron: process.env.POLL_INTERVAL_CRON || '*/5 * * * *',
    packingWaitTimeoutH: parseInt(process.env.PACKING_WAIT_TIMEOUT_H || '24'),
    planConfirmTimeoutH: parseInt(process.env.PLAN_CONFIRM_TIMEOUT_H || '2'),
    shipmentSyncRetry: parseInt(process.env.SHIPMENT_SYNC_RETRY || '10'),
    shipmentSyncIntervalS: parseInt(process.env.SHIPMENT_SYNC_INTERVAL_S || '60'),
  },
};
