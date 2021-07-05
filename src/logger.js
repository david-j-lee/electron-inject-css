/* eslint-disable no-console */

const chalk = require('chalk');

class Logger {
  constructor(props) {
    this.showVerbose = props ? props.verbose : false;
  }

  error(message, optionalParams) {
    if (optionalParams) {
      console.error(chalk`{red ERROR} ${message}`, optionalParams);
    } else {
      console.error(chalk`{red ERROR} ${message}`);
    }
  }

  warn(message, optionalParams) {
    if (optionalParams) {
      console.warn(chalk`{yellow WARN} ${message}`, optionalParams);
    } else {
      console.warn(chalk`{yellow WARN} ${message}`);
    }
  }

  log(message, optionalParams) {
    if (optionalParams) {
      console.log(message, optionalParams);
    } else {
      console.log(message);
    }
  }

  verbose(message, optionalParams) {
    if (this.showVerbose) {
      if (optionalParams) {
        console.log(message, optionalParams);
      } else {
        console.log(message);
      }
    }
  }
}

module.exports = { Logger };
