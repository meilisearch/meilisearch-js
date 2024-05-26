module.exports = function () {
  // This is required for tests to work with "cross-fetch" on newer node versions,
  // otherwise "cross-fetch" won't replace the builtin `fetch`
  globalThis.fetch = undefined;
};
