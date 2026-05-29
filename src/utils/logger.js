function log(level, seq, msg, data) {
  const ts = new Date().toISOString();
  const seqTag = seq ? `[${seq}]` : '';
  const dataStr = data ? ' ' + JSON.stringify(data) : '';
  console.log(`${ts} [${level}]${seqTag} ${msg}${dataStr}`);
}

module.exports = {
  info: (seq, msg, data) => log('INFO', seq, msg, data),
  warn: (seq, msg, data) => log('WARN', seq, msg, data),
  error: (seq, msg, data) => log('ERROR', seq, msg, data),
};
