'use strict';

// Node's bundled CA policy is independent of extension/browser TLS.
function isSupported (version) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) return false;
  const [major, minor, patch] = version.split('.').map(Number);
  const floors = { 22: [23, 4], 24: [22, 1], 26: [12, 1] };
  const floor = floors[major];
  return Boolean(floor && (minor > floor[0] || (minor === floor[0] && patch >= floor[1])));
}

if (require.main === module && !isSupported(process.versions.node)) {
  console.error('Use patched Node 22.23.4+, 24.22.1+, or 26.12.1+ within those majors (nvm use).');
  process.exitCode = 1;
}

module.exports = { isSupported };
