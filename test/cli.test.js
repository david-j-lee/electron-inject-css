const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { expect } = chai;
chai.use(sinonChai);
const proxyquire = require('proxyquire');

const glob = require('glob-promise');
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
  // proxyquire
  let globStub;
  let injectCssStub;
  let cli;

  // regular sinon stubs
  let inquirerPromptStub;

  beforeEach(() => {
    // proxyquire
    globStub = sinon.stub(glob, 'promise');
    injectCssStub = sinon.stub(main, 'injectCss');
    cli = proxyquire('../src/cli', {
      glob: globStub,
      injectCss: injectCssStub,
    });

    // regular sinon stubs
    inquirerPromptStub = sinon.stub(inquirer, 'prompt');
    inquirerPromptStub.withArgs([]).resolves({});
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should show help with -h', async () => {
    try {
      await cli.cli([...BASE_ARGS, '-h']);
    } catch (error) {
      expect(error.exitCode).to.equal(0);
      expect(inquirerPromptStub).to.not.have.been.called;
      expect(injectCssStub).to.not.have.been.called;
    }
  });

  it('should step user through theme setup successfully with valid options', async () => {
    const product = 'element';
    const theme = 'compact';
    const yes = true;

    globStub.resolves(['some-path']);
    inquirerPromptStub
      .withArgs([QUESTIONS.WIZARD_TYPE])
      .resolves({ wizardType: 'I would like to select a theme.' });
    inquirerPromptStub
      .withArgs([QUESTIONS.PRODUCT])
      .resolves({ productInput: product });
    inquirerPromptStub
      .withArgs([QUESTIONS.THEME])
      .resolves({ themeInput: theme });
    inquirerPromptStub.withArgs([QUESTIONS.YES]).resolves({ yes });
    injectCssStub.resolves();

    await cli.cli([...BASE_ARGS]);

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

    inquirerPromptStub
      .withArgs([QUESTIONS.WIZARD_TYPE])
      .resolves({ wizardType: 'I would like to configure it myself.' });
    inquirerPromptStub
      .withArgs([
        QUESTIONS.SRC,
        QUESTIONS.CSS,
        QUESTIONS.CSS_DEST,
        QUESTIONS.HTML,
      ])
      .resolves({ src, css, cssDest, html });
    inquirerPromptStub.withArgs([QUESTIONS.YES]).resolves({ yes });
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
    globStub.resolves(['some-path']);
    inquirerPromptStub.withArgs([QUESTIONS.YES]).resolves({ yes: true });
    injectCssStub.resolves();

    await cli.cli([...BASE_ARGS, 'element', 'compact']);

    expect(inquirerPromptStub).to.have.been.called;
    expect(injectCssStub).to.have.been.called;
  });

  it('should throw error with valid product, theme and no on prompt for confirmation', async () => {
    globStub.resolves(['some-path']);
    inquirerPromptStub.withArgs([QUESTIONS.YES]).resolves({ yes: false });
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
    globStub.resolves(['some-path']);
    sinon.stub(process, 'version').value('11.0.0');
    injectCssStub.resolves();

    await cli.cli([...BASE_ARGS, 'element', 'compact', '-y']);

    expect(injectCssStub).to.have.been.called;
  });

  it('should exit if args cannot be parsed', async () => {
    const argStub = sinon.stub().throws(new Error('Parse failed.'));
    cli = proxyquire('../src/cli', { arg: argStub });
    try {
      await cli.cli([...BASE_ARGS]);
    } catch (error) {
      expect(error.exitCode).to.equal(1);
      expect(inquirerPromptStub).to.not.have.been.called;
      expect(injectCssStub).to.not.have.been.called;
    }
  });

  it('should exit if no themes are found', async () => {
    inquirerPromptStub.withArgs([QUESTIONS.YES]).resolves({ yes: true });
    injectCssStub.resolves();

    try {
      await cli.cli([...BASE_ARGS, 'i-should-never-exist-foo-bar!']);
    } catch (error) {
      expect(error.exitCode).to.equal(1);
      expect(inquirerPromptStub).to.have.been.called;
      expect(injectCssStub).to.not.have.been.called;
    }
  });

  it('should exit if incorrect theme is given for valid product', async () => {
    inquirerPromptStub.withArgs([QUESTIONS.YES]).resolves({ yes: true });
    injectCssStub.resolves();

    try {
      await cli.cli([...BASE_ARGS, 'element', 'i-should-never-exist-foo-bar!']);
    } catch (error) {
      expect(error.exitCode).to.equal(1);
      expect(inquirerPromptStub).to.have.been.called;
      expect(injectCssStub).to.not.have.been.called;
    }
  });

  it('should prompt for src if one cannot be located for a valid theme', async () => {
    const product = 'element';
    const theme = 'compact';
    const src = 'testing';
    const yes = true;
    globStub.resolves([]);
    inquirerPromptStub.withArgs([QUESTIONS.SRC]).resolves({ src });
    inquirerPromptStub.withArgs([QUESTIONS.YES]).resolves({ yes });
    injectCssStub.resolves();

    await cli.cli([...BASE_ARGS, product, theme]);

    expect(inquirerPromptStub).to.have.been.called;
    expect(injectCssStub).to.have.been.called;
    sinon.assert.calledWith(injectCssStub, {
      product,
      theme,
      help: undefined,
      html: sinon.match.string,
      src,
      srcBin: undefined,
      css: sinon.match.string,
      cssDest: sinon.match.string,
      verbose: undefined,
      name: 'Compact',
      yes,
    });
  });

  it('should not prompt for a wizard type if certain flags are provided', async () => {
    const src = 'testing/app.asar';
    const html = 'testing/index.html';
    const css = 'testing/style.css';
    const cssDest = 'bundles/styles.css';
    const yes = true;

    globStub.resolves([]);
    const inquirerWizardTypeStub = inquirerPromptStub.withArgs([
      QUESTIONS.WIZARD_TYPE,
    ]);
    inquirerPromptStub
      .withArgs([QUESTIONS.CSS, QUESTIONS.CSS_DEST, QUESTIONS.HTML])
      .resolves({ css, cssDest, html });
    inquirerPromptStub.withArgs([QUESTIONS.YES]).resolves({ yes });
    injectCssStub.resolves();

    await cli.cli([...BASE_ARGS, '--src', src]);

    expect(inquirerWizardTypeStub).to.not.have.been.called;
    expect(injectCssStub).to.have.been.called;
  });
});
