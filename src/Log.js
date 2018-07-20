//
// Log output

const term = require("terminal-kit").terminal

module.exports = new class Log {

  /** Debug output */
  debug(moduleName, ...args) {
    args = args.map(a => stringify(a))
    term.gray(" DEBUG  ").gray(makeLen(moduleName, 16))(args.join(" - ") + "\n")
  }

  /** Info output */
  info(moduleName, ...args) {
    args = args.map(a => stringify(a))
    term.blue(" INFO   ").gray(makeLen(moduleName, 16))(args.join(" - ") + "\n")
  }

  /** Warning output */
  warn(moduleName, ...args) {
    args = args.map(a => stringify(a))
    term.yellow(" WARN   ").gray(makeLen(moduleName, 16))(args.join(" - ") + "\n")
  }

  /** Warning output */
  warning(moduleName, ...args) {
    this.warn(moduleName, ...args)
  }

  /** Error output */
  error(moduleName, ...args) {
    args = args.map(a => stringify(a))
    term.red(" ERROR  ").gray(makeLen(moduleName, 16))(args.join(" - ") + "\n")
  }

  /** Return an object whose functions are all wrapped with a certain module */
  wrap(moduleName) {

    // Bind all functions
    return {
      debug: this.debug.bind(this, moduleName),
      info: this.info.bind(this, moduleName),
      warn: this.warn.bind(this, moduleName),
      warning: this.warning.bind(this, moduleName),
      error: this.error.bind(this, moduleName),
    }

  }

}


/** Make sure argument is a string, or convert it if needed */
function stringify(a) {
  if (typeof a == "object")
    return JSON.stringify(a)
  else
    return "" + a
}

/** Make sure string is a certain length, padding if needed */
function makeLen(string, length, padding = " ") {

  var out = string.substring(0, length)
  if (padding)
    while (out.length < length)
      out += padding

  return out

}
