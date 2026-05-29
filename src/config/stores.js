/**
 * 店铺静态配置
 * 来源：领星ERP店铺列表
 *
 * sid          — 领星内部店铺ID（createShipmentPlan 用）
 * seller_id    — 亚马逊 Seller ID（createReadySendOrder list[].seller_id 用）
 * marketplace_id — 亚马逊市场ID（createReadySendOrder list[].marketplace_id 用）
 */
const STORES = {
  'MT-US':  { sid: 11545, seller_id: 'AZGV1IEN6OI6N', marketplace_id: 'ATVPDKIKX0DER' },
  'MT-CA':  { sid: 11546, seller_id: 'AZGV1IEN6OI6N', marketplace_id: 'A2EUQ1WTGCTBG2' },
  'JQ-US':  { sid: 11548, seller_id: 'ALV52DMTUSZYG', marketplace_id: 'ATVPDKIKX0DER' },
  'JQ-CA':  { sid: 11549, seller_id: 'ALV52DMTUSZYG', marketplace_id: 'A2EUQ1WTGCTBG2' },
  'WSH-US': { sid: 11563, seller_id: 'AI77YJLIIFKMC', marketplace_id: 'ATVPDKIKX0DER' },
  'ZX-US':  { sid: 11562, seller_id: 'A3UYGUT6R36VDF', marketplace_id: 'ATVPDKIKX0DER' },
  'SY-US':  { sid: 11547, seller_id: 'A346U59ZZR17GM', marketplace_id: 'ATVPDKIKX0DER' },
  'RKZ-US': { sid: 11550, seller_id: 'A2LELX81B7BHKP', marketplace_id: 'ATVPDKIKX0DER' },
  'DX-US':  { sid: 11561, seller_id: 'A24XFKK7W1RNGB', marketplace_id: 'ATVPDKIKX0DER' },
  'RR-UK':  { sid: 11551, seller_id: 'A1RR55V1FBBSVL', marketplace_id: 'A1F83G8C2ARO7P' },
  'RR-IT':  { sid: 11552, seller_id: 'A1RR55V1FBBSVL', marketplace_id: 'APJ6JRA9NG5V4'  },
  'RR-DE':  { sid: 11553, seller_id: 'A1RR55V1FBBSVL', marketplace_id: 'A1PA6795UKMFR9' },
  'RR-FR':  { sid: 11554, seller_id: 'A1RR55V1FBBSVL', marketplace_id: 'A13V1IB3VIYZZH' },
  'RR-ES':  { sid: 11555, seller_id: 'A1RR55V1FBBSVL', marketplace_id: 'A1RKKUPIHCS9HS' },
};

/**
 * 仓库静态配置
 * 来源：领星ERP仓库列表
 * 发货场景主要使用深圳仓库（wid: 10518）
 */
const WAREHOUSES = {
  '深圳仓库':       { wid: 10518 },
  '低价商城仓库':   { wid: 17631 },
  'TK仓库':         { wid: 18897 },
  '样衣仓库':       { wid: 17300 },
  '样衣仓-一部':    { wid: 20587 },
  '样衣仓-二部':    { wid: 20588 },
  '样衣仓-产品部':  { wid: 20937 },
  '样衣仓-开发部':  { wid: 20936 },
  '样衣仓-总经办':  { wid: 21005 },
  '样衣仓-技术部':  { wid: 21007 },
  '样衣仓-摄影组':  { wid: 20933 },
  '样衣仓-生产部':  { wid: 21008 },
  '样衣仓-设计组':  { wid: 20934 },
  '样衣仓-设计部':  { wid: 20935 },
};

// 默认发货仓库
const DEFAULT_SHIPPING_WID = WAREHOUSES['深圳仓库'].wid;

/**
 * 通过 sid 反查店铺配置
 */
function getStoreBySid(sid) {
  return Object.entries(STORES).find(([, v]) => v.sid === sid)?.[1] || null;
}

/**
 * 通过店铺名称查配置
 */
function getStoreByName(name) {
  return STORES[name] || null;
}

module.exports = {
  STORES,
  WAREHOUSES,
  DEFAULT_SHIPPING_WID,
  getStoreBySid,
  getStoreByName,
};
