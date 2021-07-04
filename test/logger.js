const { expect } = require('chai');
const { Logger } = require('../src/logger');

// TODO: A large portion of these tests do not have any asserts. Need to figure
// out how to assert that console.log gets called.

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger();
  });

  describe('error', () => {
    it('should log with optionalParams', () => {
      logger.error('testing', { test: 'ing' });
    });
    it('should log without optionalParams', () => {
      logger.error('testing');
    });
  });

  describe('warn', () => {
    it('should log with optionalParams', () => {
      logger.warn('testing', { test: 'ing' });
    });
    it('should log without optionalParams', () => {
      logger.warn('testing');
    });
  });

  describe('log', () => {
    it('should log with optionalParams', () => {
      logger.log('testing', { test: 'ing' });
    });
    it('should log without optionalParams', () => {
      logger.log('testing');
    });
  });

  describe('verbose', () => {
    it('should set showVerbose on constructor', () => {
      logger = new Logger({ verbose: true });
      expect(logger.showVerbose).to.equal(true);
    });
    it('should log with optionalParams and showVerbose true', () => {
      logger.showVerbose = true;
      logger.verbose('testing', { test: 'ing' });
    });
    it('should log without optionalParams and showVerbose true', () => {
      logger.showVerbose = true;
      logger.verbose('testing');
    });
    it('should not log when showVerbose is false', () => {
      logger.showVerbose = false;
      logger.verbose('testing');
    });
  });
});
