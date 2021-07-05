const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { expect } = chai;
chai.use(sinonChai);
const proxyquire = require('proxyquire');

const inquirer = require('inquirer');
const main = require('../src/main');

const BASE_ARGS = [
  'node.exe',
  'node_modules/electron-inject-css/bin/electron-inject-css',
];

const QUESTIONS = {
  YES: {
    type: 'confirm',
    name: 'yes',
    message: sinon.match.string,
  },
  WIZARD_TYPE: {
    type: 'list',
    name: 'wizardType',
    message: sinon.match.string,
    choices: sinon.match.array,
  },
  PRODUCT: {
    type: 'list',
    name: 'productInput',
    message: sinon.match.string,
    choices: sinon.match.array,
  },
  THEME: {
    type: 'list',
    name: 'themeInput',
    message: sinon.match.string,
    choices: sinon.match.array,
  },
  SRC: {
    type: 'input',
    name: 'src',
    message: sinon.match.string,
    default: sinon.match.string,
  },
  CSS: {
    type: 'input',
    name: 'css',
    message: sinon.match.string,
    default: sinon.match.string,
  },
  CSS_DEST: {
    type: 'input',
    name: 'cssDest',
    message: sinon.match.string,
    default: sinon.match.string,
  },
  HTML: {
    type: 'input',
    name: 'html',
    message: sinon.match.string,
    default: sinon.match.string,
  },
};

// TODO: A lot of these asserts can be improved.
describe('cli', () => {
  let cli;

  const inquirerStub = sinon.stub(inquirer, 'prompt');
  const injectCssStub = sinon.stub(main, 'injectCss');

  beforeEach(() => {
    cli = proxyquire('../src/cli', { injectCss: injectCssStub });
    inquirerStub.withArgs([]).resolves({});
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should show help with -h', async () => {
    try {
      await cli.cli([...BASE_ARGS, '-h']);
    } catch (error) {
      expect(error.exitCode).to.equal(0);
      expect(inquirerStub).to.not.have.been.called;
      expect(injectCssStub).to.not.have.been.called;
    }
  });

  it('should step user through theme setup successfully with valid options', async () => {
    const product = 'element';
    const theme = 'compact';
    const yes = true;

    inquirerStub
      .withArgs([QUESTIONS.WIZARD_TYPE])
      .resolves({ wizardType: 'I would like to select a theme.' });
    inquirerStub
      .withArgs([QUESTIONS.PRODUCT])
      .resolves({ productInput: product });
    inquirerStub.withArgs([QUESTIONS.THEME]).resolves({ themeInput: theme });
    inquirerStub.withArgs([QUESTIONS.YES]).resolves({ yes });
    injectCssStub.resolves();

    await cli.cli([
      'node.exe',
      'node_modules/electron-inject-css/bin/electron-inject-css',
    ]);

    expect(injectCssStub).to.have.been.called;
    sinon.assert.calledWith(injectCssStub, {
      product,
      theme,
      help: undefined,
      html: sinon.match.string,
      src: sinon.match.string,
      srcBin: undefined,
      css: sinon.match.string,
      cssDest: sinon.match.string,
      verbose: undefined,
      name: 'Compact',
      yes,
    });
  });

  it('should step user through manual setup successfully with valid options', async () => {
    const html = 'testing/index.html';
    const src = 'testing/app.asar';
    const css = 'testing/style.css';
    const cssDest = 'bundles/styles.css';
    const yes = true;

    inquirerStub
      .withArgs([QUESTIONS.WIZARD_TYPE])
      .resolves({ wizardType: 'I would like to configure it myself.' });
    inquirerStub
      .withArgs([
        QUESTIONS.SRC,
        QUESTIONS.CSS,
        QUESTIONS.CSS_DEST,
        QUESTIONS.HTML,
      ])
      .resolves({ src, css, cssDest, html });
    inquirerStub.withArgs([QUESTIONS.YES]).resolves({ yes });
    injectCssStub.resolves();

    await cli.cli([...BASE_ARGS]);

    expect(injectCssStub).to.have.been.called;
    sinon.assert.calledWith(injectCssStub, {
      product: undefined,
      theme: undefined,
      help: undefined,
      html,
      src,
      srcBin: undefined,
      css,
      cssDest,
      verbose: undefined,
      // name: undefined only added when args is populated from a theme.
      yes,
    });
  });

  it('should call injectCssStub with valid product, theme and yes on prompt for confirmation', async () => {
    inquirerStub.withArgs([QUESTIONS.YES]).resolves({ yes: true });
    injectCssStub.resolves();

    await cli.cli([...BASE_ARGS, 'element', 'compact']);

    expect(inquirerStub).to.have.been.called;
    expect(injectCssStub).to.have.been.called;
  });

  it('should throw error with valid product, theme and no on prompt for confirmation', async () => {
    inquirerStub.withArgs([QUESTIONS.YES]).resolves({ yes: false });
    injectCssStub.resolves();

    try {
      await cli.cli([...BASE_ARGS, 'element', 'compact']);
    } catch (error) {
      expect(error.exitCode).to.equal(0);
      expect(injectCssStub).to.not.have.been.called;
    }
  });

  it('should error if node version is not supported', async () => {
    sinon.stub(process, 'version').value('10.0.0');

    try {
      await cli.cli([...BASE_ARGS]);
    } catch (error) {
      expect(error.exitCode).to.equal(1);
      expect(injectCssStub).to.not.have.been.called;
    }
  });

  it('should warn user if node version is not recommended', async () => {
    sinon.stub(process, 'version').value('11.0.0');
    injectCssStub.resolves();

    await cli.cli([...BASE_ARGS, 'element', 'compact', '-y']);

    expect(injectCssStub).to.have.been.called;
  });
});
