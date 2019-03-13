const path = require('path');

const pkg = require('../package.json');

const cwd = process.cwd();

exports.joinToCwd = path.join.bind(null, cwd);
exports.joinToDist = path.join.bind(null, cwd, `dist-${pkg.version}`);
