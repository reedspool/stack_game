UTIL = (function() {
  
  function _deepCopy(o) {
    return JSON.parse(JSON.stringify(o))
  }

  return {
    deepCopy: _deepCopy
  }
})()