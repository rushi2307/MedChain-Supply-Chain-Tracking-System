function write(level, event, details = {}) {
  const entry = {
    time: new Date().toISOString(),
    level,
    event,
    ...details
  };
  console.log(JSON.stringify(entry));
}

module.exports = {
  info: (event, details) => write('info', event, details),
  warn: (event, details) => write('warn', event, details),
  error: (event, details) => write('error', event, details)
};
