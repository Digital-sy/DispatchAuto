# DispatchAuto

FBA 发货流程全自动化系统，基于领星 ERP OpenAPI + 飞书通知 + 云服务器调度。

运营唯一操作：在领星中创建发货计划 → 系统自动完成后续所有步骤。

---

## 架构概览

```
领星ERP (发货计划)
    ↓ 定时轮询检测新计划
DispatchAuto 调度层 (云服务器)
    ↓ 自动执行 Step 1-9
飞书通知 (各节点完成 / 异常告警 / 人工确认)
```

## 自动化流程

| 步骤 | 动作 | 类型 |
|------|------|------|
| Step 1 | 检测领星新发货计划 | 自动 |
| Step 2 | 校验本地仓库库存 | 自动 |
| Step 3 | 飞书通知仓库盘点 | 自动 |
| Step 4 | 等待仓库回传装箱数据 | 人工（仓库填表） |
| Step 5 | 库存不足时飞书通知运营确认 | 人工（按需触发） |
| Step 6 | 创建 STA 任务，替运营建亚马逊货件 | 自动 |
| Step 7 | 飞书推送分仓方案，运营点选确认 | 人工（轻量） |
| Step 8 | 确认货件方案，同步货件号，生成发货单 | 自动 |
| Step 9 | 触发发货，扣减本地库存 | 自动 |

## 技术栈

- **Runtime**：Node.js 18+
- **领星 ERP**：OpenAPI（覆盖发货计划、发货单、STA货件全链路）
- **亚马逊货件**：通过领星 STA 接口代理，无需直接对接 SP-API
- **通知 / 人工确认**：飞书 Incoming Webhook + 交互消息
- **调度**：node-cron 定时轮询，云服务器常驻运行

## 目录结构

```
src/
├── api/
│   ├── lingxing/
│   │   ├── auth.js               # token 获取与自动刷新
│   │   ├── inventory.js          # 库存查询
│   │   ├── shipment_plan.js      # 发货计划（创建 / 编辑 / 查询）
│   │   ├── shipment_order.js     # 发货单（创建 / 发货 / 作废 / 释放库存）
│   │   └── sta.js                # FBA 货件 STA 全流程
│   └── feishu/
│       └── webhook.js            # 飞书消息推送
├── workflow/
│   ├── index.js                  # 主调度入口，定时轮询
│   ├── step1_detect_plan.js      # 检测新发货计划
│   ├── step2_check_inventory.js  # 库存校验
│   ├── step3_notify_warehouse.js # 通知仓库盘点
│   ├── step4_wait_packing.js     # 等待装箱数据回传
│   ├── step5_inventory_alert.js  # 库存不足人工介入
│   ├── step6_create_sta.js       # STA 货件创建全链路
│   ├── step7_confirm_plan.js     # 分仓方案人工确认
│   ├── step8_sync_shipment.js    # 同步货件号 + 生成发货单
│   └── step9_send_goods.js       # 发货 + 扣减库存
├── utils/
│   ├── poller.js                 # 通用轮询（含超时 / 重试）
│   ├── retry.js                  # 指数退避重试
│   └── logger.js                 # 日志
└── config/
    └── index.js                  # 环境变量统一读取

docs/
├── api_reference.md              # 领星接口速查
└── warehouse_form.md             # 仓库装箱回传表单说明
```

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入领星 app_key / app_secret 和飞书 webhook

# 3. 启动
node src/workflow/index.js
```

## 关键设计说明

- **令牌桶限制**：领星每个接口容量为 1，调用间隔 ≥ 1s，poller.js 已内置节流
- **Token 刷新**：access_token 有效期 2 小时，auth.js 自动检测并刷新
- **数据延迟**：货件号同步前先调用「同步亚马逊货件到ERP」接口，再轮询 is_relate_mws
- **库存不足**：仓库回传数量 < 计划数量时，流程暂停并飞书通知运营决策
- **分仓确认**：亚马逊返回多个分仓方案时，通过飞书交互消息由运营选择后继续
- **异常回滚**：任意步骤失败自动调用 invalid 作废发货单，isReturnStock=1 恢复库存
