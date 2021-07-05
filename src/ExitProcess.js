class ExitProcess extends Error {
  constructor(exitCode, message, cause) {
    super(message);
    this.exitCode = exitCode;
    this.cause = cause;
    this.name = 'ExitProcess';
  }
}

module.exports = ExitProcess;
