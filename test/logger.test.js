const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { expect } = chai;
chai.use(sinonChai);

const { Logger } = require('../src/logger');

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('error', () => {
    it('should log with optionalParams', () => {
      const optionalParams = { test: 'ing' };
      const consoleStub = sinon.stub(console, 'error');
      logger.error('testing', optionalParams);
      sinon.assert.calledWithExactly(
        consoleStub,
        sinon.match.string,
        optionalParams
      );
    });
    it('should log without optionalParams', () => {
      const consoleStub = sinon.stub(console, 'error');
      logger.error('testing');
      sinon.assert.calledWithExactly(consoleStub, sinon.match.string);
    });
  });

  describe('warn', () => {
    it('should log with optionalParams', () => {
      const optionalParams = { test: 'ing' };
      const consoleStub = sinon.stub(console, 'warn');
      logger.warn('testing', optionalParams);
      sinon.assert.calledWithExactly(
        consoleStub,
        sinon.match.string,
        optionalParams
      );
    });
    it('should log without optionalParams', () => {
      const consoleStub = sinon.stub(console, 'warn');
      logger.warn('testing');
      sinon.assert.calledWithExactly(consoleStub, sinon.match.string);
    });
  });

  describe('log', () => {
    it('should log with optionalParams', () => {
      const optionalParams = { test: 'ing' };
      const consoleStub = sinon.stub(console, 'log');
      logger.log('testing', optionalParams);
      sinon.assert.calledWithExactly(
        consoleStub,
        sinon.match.string,
        optionalParams
      );
    });
    it('should log without optionalParams', () => {
      const consoleStub = sinon.stub(console, 'log');
      logger.log('testing');
      sinon.assert.calledWithExactly(consoleStub, sinon.match.string);
    });
  });

  describe('verbose', () => {
    it('should set showVerbose on constructor', () => {
      logger = new Logger({ verbose: true });
      expect(logger.showVerbose).to.equal(true);
    });
    it('should log with optionalParams and showVerbose true', () => {
      const optionalParams = { test: 'ing' };
      const consoleStub = sinon.stub(console, 'log');
      logger.showVerbose = true;
      logger.verbose('testing', optionalParams);
      sinon.assert.calledWithExactly(
        consoleStub,
        sinon.match.string,
        optionalParams
      );
    });
    it('should log without optionalParams and showVerbose true', () => {
      const consoleStub = sinon.stub(console, 'log');
      logger.showVerbose = true;
      logger.verbose('testing');
      sinon.assert.calledWithExactly(consoleStub, sinon.match.string);
    });
    it('should not log when showVerbose is false', () => {
      const consoleStub = sinon.stub(console, 'log');
      logger.showVerbose = false;
      logger.verbose('testing');
      expect(consoleStub).to.not.be.called;
    });
  });
});
