# 仓库装箱数据回传说明

仓库完成盘点后，需通过以下方式回传装箱数据，系统收到后自动继续后续流程。

## 回传字段

| 字段 | 说明 | 单位 | 必填 |
|------|------|------|------|
| seq | 批次号（飞书通知中提供） | — | 是 |
| boxes | 装箱列表 | — | 是 |
| boxes[].sku | SKU | — | 是 |
| boxes[].length | 箱子长 | CM | 是 |
| boxes[].width | 箱子宽 | CM | 是 |
| boxes[].height | 箱子高 | CM | 是 |
| boxes[].weight | 单箱重量 | KG | 是 |
| boxes[].boxNum | 箱数 | 个 | 是 |
| boxes[].quantityInCase | 单箱数量 | PCS | 是 |
| actualQty | 实际可发数量（如与计划不符填写） | PCS | 否 |

## 回传方式

**当前阶段**：仓库填写飞书文档/表格，账管确认后手动触发系统接口。

**后续迭代**：系统提供 HTTP 接口，仓库直接提交：

```
POST /api/packing-callback
Content-Type: application/json

{
  "seq": "RP260529001",
  "boxes": [
    {
      "sku": "RRBX422-BK-XL",
      "length": 40,
      "width": 30,
      "height": 25,
      "weight": 3.5,
      "boxNum": 5,
      "quantityInCase": 20
    }
  ]
}
```

## 注意事项

- 重量单位为 **KG**，尺寸单位为 **CM**，系统直接传入领星，无需换算
- 如实际数量少于计划数量，填写 `actualQty`，系统会通知运营确认是否继续
- 批次号从飞书通知消息中获取，格式如 `RP260529001`
