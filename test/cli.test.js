const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { expect } = chai;
chai.use(sinonChai);

const inquirer = require('inquirer');
const mainModule = require('../src/main');
const { cli } = require('../src/cli');

describe('cli', () => {
  // TODO: Finish unit test
  xit('should call injectCssStub with no prompts with valid product and theme', async () => {
    const processStub = sinon.stub(process, 'exit');
    const inquirerStub = sinon.stub(inquirer, 'prompt').resolves({});
    const injectCssStub = sinon.stub(mainModule, 'injectCss').resolves();
    await cli([
      'C:\\Program Files\\nodejs\\node.exe',
      'C:\\Program Files\\nodejs\\node_modules\\electron-inject-css\\bin\\electron-inject-css',
      'element',
      'compact',
    ]);
    expect(inquirerStub).to.have.been.called;
    expect(processStub).to.have.been.called;
    expect(injectCssStub).to.not.have.been.called;
  });
});
