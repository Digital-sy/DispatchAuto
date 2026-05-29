const logger = require('./logger');

/**
 * 通用轮询工具
 * @param {Function} fn - 每次轮询执行的异步函数，返回 { done, result } 或抛出异常
 * @param {object} opts
 * @param {number} opts.intervalMs - 轮询间隔ms
 * @param {number} opts.timeoutMs - 超时ms，超时后抛出错误
 * @param {string} opts.seq - 日志用批次号
 * @param {string} opts.label - 日志描述
 */
async function poll(fn, { intervalMs = 60000, timeoutMs = 3600000, seq = '', label = '轮询' } = {}) {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    logger.info(seq, `${label} 第${attempt}次`);
    const { done, result } = await fn();
    if (done) {
      logger.info(seq, `${label} 完成`);
      return result;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise(r => setTimeout(r, Math.min(intervalMs, remaining)));
  }
  throw new Error(`${label} 超时（${timeoutMs / 1000}s）`);
}

module.exports = { poll };
