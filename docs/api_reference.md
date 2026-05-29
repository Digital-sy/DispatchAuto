# 领星 ERP OpenAPI 速查

Base URL: `https://openapi.lingxing.com`

鉴权参数（每次请求URL附带）：
- `access_token` — OAuth2 token，有效期2小时
- `timestamp` — Unix时间戳（秒）
- `sign` — MD5(app_key + timestamp + access_token)
- `app_key` — 应用Key

令牌桶：每个接口容量1，建议调用间隔 ≥ 1s

---

## 库存

| 接口 | Path |
|------|------|
| 查询仓库库存明细 | POST `/erp/sc/routing/data/local_inventory/inventoryDetails` |

关键返回字段：`product_valid_num`（可用量）

---

## 发货计划

| 接口 | Path |
|------|------|
| 查询发货计划列表 | POST `/erp/sc/data/fba_report/shipmentPlanLists` |
| 创建FBA发货计划 | POST `/erp/sc/routing/storage/shipment/createShipmentPlan` |
| 编辑FBA发货计划 | POST `/erp/sc/routing/storage/shipment/updateShipmentPlan` |

关键字段：`seq`（批次号）、`order_sn`（计划单号）、`is_relate_mws`（是否关联货件）、`lock_status`

---

## 发货单

| 接口 | Path |
|------|------|
| 生成待发货发货单 | POST `/erp/sc/routing/storage/shipment/createReadySendOrder` |
| 查询建单结果（异步） | POST `/erp/sc/routing/storage/shipment/searchProcessResult` |
| 查询发货单列表 | POST `/erp/sc/routing/storage/shipment/getInboundShipmentList` |
| 查询发货单详情 | POST `/erp/sc/routing/storage/shipment/getInboundShipmentListMwsDetail` |
| FBA发货单发货 | POST `/erp/sc/storage/shipment/sendGoods` |
| 作废发货单 | POST `/basicOpen/openapi/fbaShipment/shipmentSn/invalid` |
| 释放库存 | POST `/erp/sc/routing/storage/shipment/releaseStock` |

---

## FBA货件（STA）

| 接口 | Path | 说明 |
|------|------|------|
| 创建STA任务 | POST `...sta/createTask` | 第一步 |
| 查询包装组 | POST `...sta/listPackingGroupItems` | |
| 保存装箱信息 | POST `...sta/savePackingInfo` | |
| 提交装箱信息 | POST `...sta/submitPackingInfo` | 异步 |
| 生成货件方案 | POST `...sta/generateShipmentPlan` | 异步 |
| 查询货件方案 | POST `...sta/shipmentPreview` | |
| 确认货件方案 | POST `...sta/confirmShipmentPlan` | 人工确认后调用 |
| 生成承运方式 | POST `...sta/generateTransportList` | |
| 查询承运方式 | POST `...sta/getTransportList` | |
| 生成可选送达时间 | POST `...sta/generateDeliveryDateList` | |
| 查询可选送达时间 | POST `...sta/getDeliveryDateList` | |
| 提交送达时间 | POST `...sta/submitDeliveryTime` | |
| 提交货件配送服务 | POST `...sta/submitDistributionService` | |
| 同步亚马逊货件到ERP | POST `...sta/syncShipment` | 建发货单前调用 |
| 查询异步任务状态 | POST `...sta/queryAsyncTask` | 轮询异步步骤 |
| 取消STA任务 | POST `...sta/cancelTask` | 异常回滚 |
