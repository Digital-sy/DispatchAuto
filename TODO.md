# DispatchAuto · TODO

> 按优先级分级，P0 为主链路必须，P1 为稳定性保障，P2 为增强功能。
> SP-API 直连暂不列入，待主链路跑稳后单独规划。

---

## P0 · 主链路（Phase 1-2，目标 3 周上线）

### 基础设施
- [ ] `src/config/index.js` — 环境变量读取（app_key / app_secret / webhook / wid / 轮询间隔）
- [ ] `src/utils/logger.js` — 日志工具（info / warn / error，含时间戳和 seq 标识）
- [ ] `src/utils/retry.js` — 指数退避重试（maxRetry / baseDelay / factor）
- [ ] `src/utils/poller.js` — 通用轮询工具（interval / timeout / condition / onTimeout）
- [ ] `.env.example` — 环境变量模板
- [ ] `package.json` — 依赖声明（node-cron / axios / dotenv）

### 领星接口封装
- [ ] `src/api/lingxing/auth.js`
  - [ ] 获取 access_token（app_key + app_secret）
  - [ ] token 缓存 + 到期前 10 分钟自动刷新
  - [ ] sign 生成逻辑（MD5(app_key + timestamp + access_token)）
  - [ ] 请求基础方法（自动附加鉴权参数，调用间隔节流 ≥ 1s）
- [ ] `src/api/lingxing/inventory.js`
  - [ ] `getInventory(sku, wid)` — 查询本地库存可用量
- [ ] `src/api/lingxing/shipment_plan.js`
  - [ ] `listShipmentPlans(params)` — 查询发货计划列表
  - [ ] `createShipmentPlan(productList)` — 创建发货计划
  - [ ] `updateShipmentPlan(orderSn, params)` — 编辑发货计划（回填装箱数据）
- [ ] `src/api/lingxing/shipment_order.js`
  - [ ] `createReadySendOrder(params)` — 生成待发货发货单
  - [ ] `pollCreateResult(requestFlag)` — 轮询异步建单结果
  - [ ] `sendGoods(shipmentNos)` — 发货单发货（扣减库存）
  - [ ] `invalidShipment(shipmentNos)` — 作废发货单（回滚用）
  - [ ] `releaseStock(shipmentNos)` — 释放库存
  - [ ] `getShipmentList(params)` — 查询发货单列表
- [ ] `src/api/lingxing/sta.js`
  - [ ] `createSTATask(params)` — 创建 STA 任务
  - [ ] `listPackingGroupItems(staTaskId)` — 查询包装组
  - [ ] `savePackingInfo(params)` — 保存装箱信息
  - [ ] `submitPackingInfo(params)` — 提交装箱信息
  - [ ] `generateShipmentPlan(params)` — 生成货件方案
  - [ ] `getShipmentPreview(params)` — 查询货件方案
  - [ ] `confirmShipmentPlan(params)` — 确认货件方案
  - [ ] `generateTransportList(params)` — 生成承运方式
  - [ ] `getTransportList(params)` — 查询承运方式
  - [ ] `generateDeliveryDateList(params)` — 生成可选送达时间
  - [ ] `getDeliveryDateList(params)` — 查询可选送达时间
  - [ ] `submitDeliveryTime(params)` — 提交送达时间
  - [ ] `submitDistributionService(params)` — 提交货件配送服务
  - [ ] `syncShipmentToERP(params)` — 同步亚马逊货件到 ERP
  - [ ] `pollAsyncTask(taskId)` — 查询异步任务状态
  - [ ] `cancelSTATask(taskId)` — 取消 STA 任务（异常回滚）

### 飞书通知
- [ ] `src/api/feishu/webhook.js`
  - [ ] `sendText(msg)` — 发送纯文本消息
  - [ ] `sendCard(card)` — 发送交互卡片（用于人工确认节点）
  - [ ] 预置消息模板：
    - [ ] 新计划检测通知（含 seq / SKU / 数量）
    - [ ] 仓库盘点通知（含批次号 / SKU 清单）
    - [ ] 库存不足告警（含计划量 / 实际量 / 差额）
    - [ ] 分仓方案确认卡片（含各方案费用 / 仓库位置 / 选择按钮）
    - [ ] 流程完成通知（含发货单号 / 货件号）
    - [ ] 异常告警（含步骤 / 错误信息 / 已执行回滚）

### 业务流程
- [ ] `src/workflow/step1_detect_plan.js`
  - [ ] 轮询 `shipmentPlanLists`，过滤 status=5（待处理）且未被系统处理的计划
  - [ ] 本地记录已处理的 seq，防止重复触发
- [ ] `src/workflow/step2_check_inventory.js`
  - [ ] 对每个 SKU 调用 `getInventory`
  - [ ] product_valid_num ≥ shipment_plan_quantity → 通过，继续
  - [ ] 不足 → 进入 step5
- [ ] `src/workflow/step3_notify_warehouse.js`
  - [ ] 飞书推送盘点通知给仓库群
  - [ ] 消息包含：批次号 / 店铺 / SKU 列表 / 各 SKU 计划数量 / 仓库
- [ ] `src/workflow/step4_wait_packing.js`
  - [ ] 轮询等待仓库通过飞书表单回传装箱数据
  - [ ] 超时（默认 24h）发送催促提醒
  - [ ] 收到数据后调用 `updateShipmentPlan` 回填箱规
- [ ] `src/workflow/step5_inventory_alert.js`
  - [ ] 飞书推送库存不足卡片（计划量 / 实际可用量 / 差额）
  - [ ] 等待运营选择：减量继续 / 取消本次发货
  - [ ] 减量 → 更新 shipment_plan_quantity，继续 step3
  - [ ] 取消 → 记录日志，结束流程
- [ ] `src/workflow/step6_create_sta.js`
  - [ ] 按顺序调用 STA 完整链路（创建→装箱→提交→生成方案）
  - [ ] 每步调用 `pollAsyncTask` 等待异步完成
  - [ ] 生成方案后暂停，进入 step7
- [ ] `src/workflow/step7_confirm_plan.js`
  - [ ] 查询货件方案，获取所有分仓选项
  - [ ] 飞书推送交互卡片，运营选择方案
  - [ ] 收到确认 → 调用 `confirmShipmentPlan`
  - [ ] 超时未确认（默认 2h）→ 发送催促
- [ ] `src/workflow/step8_sync_shipment.js`
  - [ ] 调用 `syncShipmentToERP` 主动触发同步
  - [ ] 轮询 `shipmentPlanLists` 中 is_relate_mws=1 且 shipment_mws_sn 有值
  - [ ] 确认货件号后调用 `createReadySendOrder` 生成发货单
  - [ ] 轮询 `pollCreateResult` 等待建单完成
- [ ] `src/workflow/step9_send_goods.js`
  - [ ] 调用 `sendGoods` 触发发货扣库存
  - [ ] 飞书推送流程完成通知
- [ ] `src/workflow/index.js`
  - [ ] node-cron 定时任务（默认每 5 分钟轮询一次）
  - [ ] 并发控制（同一 seq 只允许一个流程实例运行）
  - [ ] 全局异常捕获 → 自动回滚 → 飞书告警

---

## P1 · 稳定性（Phase 2 同步完成）

- [ ] 本地 SQLite / JSON 持久化已处理 seq 状态，防止服务重启后重复触发
- [ ] 每个 step 的状态持久化（支持断点续跑）
- [ ] 领星 token 刷新失败时的告警和重试
- [ ] 接口调用失败日志（含请求参数 / 响应体 / 时间戳）
- [ ] 仓库回传数据格式校验（必填字段 / 数值范围）
- [ ] 作废回滚后飞书通知相关人员人工复查

---

## P2 · 增强功能（Phase 3，主链路稳定后）

- [ ] 物流渠道 AI 推荐（基于历史发货数据 + 当前渠道价格）
- [ ] 发货状态看板（Web 页面，展示各批次实时进度）
- [ ] 承运方式自动选择（规则配置：优先 fist 承运商 / 按渠道白名单）
- [ ] 多店铺并发支持（当前设计已预留 sid 字段）
- [ ] `docs/api_reference.md` — 领星接口速查文档
- [ ] `docs/warehouse_form.md` — 仓库装箱回传表单说明

---

## 暂缓

- [ ] SP-API 直连建货件（待主链路跑稳后单独规划）
- [ ] 亚马逊 sent to Amazon 模板自动填写（领星 STA 链路已覆盖此需求）
