'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const root = path.join(__dirname, '..');

test('build and install enforce patched supported Node releases', () => {
  const pkg = require('../package.json');
  assert.equal(pkg.engines && pkg.engines.node,
    '>=22.23.4 <23 || >=24.22.1 <25 || >=26.12.1 <27');
  assert.equal(fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim(), '24.22.1');
  assert.match(fs.readFileSync(path.join(root, '.npmrc'), 'utf8'), /^engine-strict=true$/m);
  assert.equal(pkg.scripts.preinstall, 'node scripts/check-node.cjs');
  const lockRoot = require('../package-lock.json').packages[''];
  assert.equal(lockRoot.hasInstallScript, true, 'root lock records the preinstall lifecycle hook');
  assert.deepEqual(lockRoot.engines, pkg.engines);
  assert.equal(pkg.scripts.prebuild, 'node scripts/check-node.cjs');
  assert.match(fs.readFileSync(path.join(root, 'Makefile'), 'utf8'), /readybuild: check-node/);
  const { isSupported } = require('./check-node.cjs');
  for (const version of ['22.23.4', '22.24.0', '24.22.1', '24.23.0', '26.12.1', '26.13.0']) {
    assert.equal(isSupported(version), true, version);
  }
  for (const version of ['20.99.0', '22.23.3', '23.99.0', '24.22.0', '25.99.0', '26.12.0', '27.0.0', '24.22.1-rc.1', '24.22.1+custom', 'invalid', '24.022.1']) {
    assert.equal(isSupported(version), false, version);
  }
});
