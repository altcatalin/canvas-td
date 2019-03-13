const path = require('path');
const fs = require('fs');

const optionalFilesCopyRules = (filenames, {
  root,
  outputPath
}) => {
  const rules = [];

  filenames.forEach((filename) => {
    if (fs.existsSync(filename)) {
      rules.push({
        from: path.join(root, filename),
        to: path.join(outputPath, filename)
      });
    }
  });

  return rules;
};

exports.optionalFilesCopyRules = optionalFilesCopyRules;
