const logger = require('./logger');

/**
 * 指数退避重试
 * @param {Function} fn - 异步函数
 * @param {object} opts
 * @param {number} opts.maxRetry - 最大重试次数，默认3
 * @param {number} opts.baseDelay - 初始延迟ms，默认1000
 * @param {number} opts.factor - 退避倍数，默认2
 * @param {string} opts.seq - 日志用批次号
 */
async function retry(fn, { maxRetry = 3, baseDelay = 1000, factor = 2, seq = '' } = {}) {
  let lastErr;
  for (let i = 0; i < maxRetry; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = baseDelay * Math.pow(factor, i);
      logger.warn(seq, `重试 ${i + 1}/${maxRetry}，${delay}ms 后再试`, { error: err.message });
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

module.exports = { retry };
