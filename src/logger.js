/* eslint-disable no-console */

import chalk from 'chalk';

export class Logger {
  constructor({ verbose }) {
    this.showVerbose = verbose;
  }

  error(message, optionalParams) {
    if (optionalParams) {
      console.error(chalk`{red ERROR} ${message}`, optionalParams);
    } else {
      console.error(chalk`{red ERROR} ${message}`);
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
