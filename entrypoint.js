function shouldIgnore(filename) {

  if (filename.indexOf('node_modules/pxpoint-coinbase') > -1) {
    if (filename.indexOf('node_modules/pxpoint-coinbase/node_modules') > -1) {
      return true;
    }
    // console.log(filename);
    return false;
  }

  if (filename.indexOf('pxpoint/src') > -1) {
    // console.log(filename);
    return false;
  }

  return true;
}

require('babel-register')({
  // This will override `node_modules` ignoring - you can alternatively pass
  // an array of strings to be explicitly matched or a regex / glob
  ignore: function(filename) {
    return shouldIgnore(filename);
  }
});
require('./src/index');
