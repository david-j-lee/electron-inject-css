const fs = require('fs-extra');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { expect } = chai;
chai.use(sinonChai);
const proxyquire = require('proxyquire');

const asar = require('asar');
const glob = require('glob-promise');
const inquirer = require('inquirer');

// TODO: A lot of these asserts can be improved.
describe('injectCss', () => {
  // proxyquire
  let globStub;
  let main;

  // regular sinon stubs
  let asarExtractAllStub;
  let asarCreatePackageStub;
  let fsCopyStub;
  let fsRemoveStub;
  let fsReadFileStub;
  let fsWriteFileStub;
  let inquirerPromptStub;

  beforeEach(() => {
    // proxyquire
    globStub = sinon.stub(glob, 'promise');
    main = proxyquire('../src/main', {
      glob: globStub,
    });

    // regular sinon stubs
    asarExtractAllStub = sinon.stub(asar, 'extractAll');
    asarCreatePackageStub = sinon.stub(asar, 'createPackage');
    fsCopyStub = sinon.stub(fs, 'copy');
    fsRemoveStub = sinon.stub(fs, 'remove');
    fsReadFileStub = sinon.stub(fs, 'readFile');
    fsWriteFileStub = sinon.stub(fs, 'writeFile');
    inquirerPromptStub = sinon.stub(inquirer, 'prompt');
    inquirerPromptStub.withArgs([]).resolves({});
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should inject CSS with valid parameters', async () => {
    const options = {
      product: undefined,
      theme: undefined,
      help: undefined,
      html: 'index.html',
      src: 'app.asar',
      srcBin: undefined,
      css: 'style.css',
      cssDest: 'bundle/',
      verbose: undefined,
      yes: true,
    };
    asarExtractAllStub.returns();
    asarCreatePackageStub.resolves();
    fsCopyStub.resolves();
    fsRemoveStub.resolves();
    fsReadFileStub.resolves('<html><head></head></html>');
    fsWriteFileStub.resolves();
    globStub.resolves(['some-path']);

    await main.injectCss(options);

    expect(asarCreatePackageStub).to.have.been.called;
    expect(asarExtractAllStub).to.have.been.called;
  });

  it('should inject CSS with valid parameters and custom src bin', async () => {
    const options = {
      product: undefined,
      theme: undefined,
      help: undefined,
      html: 'index.html',
      src: 'app.asar',
      srcBin: 'app.asar-temp',
      css: 'style.css',
      cssDest: 'bundle/',
      verbose: undefined,
      yes: true,
    };
    asarExtractAllStub.returns();
    asarCreatePackageStub.resolves();
    fsCopyStub.resolves();
    fsRemoveStub.resolves();
    fsReadFileStub.resolves('<html><head></head></html>');
    fsWriteFileStub.resolves();
    globStub.resolves(['some-path']);

    await main.injectCss(options);

    expect(asarCreatePackageStub).to.have.been.called;
    expect(asarExtractAllStub).to.have.been.called;
  });

  it('should exit if CSS dest cannot be located', async () => {
    const options = {
      product: undefined,
      theme: undefined,
      help: undefined,
      html: 'index.html',
      src: 'app.asar',
      srcBin: undefined,
      css: 'style.css',
      cssDest: 'css-dest',
      verbose: undefined,
      yes: true,
    };
    asarExtractAllStub.returns();
    asarCreatePackageStub.resolves();
    fsCopyStub.resolves();
    fsRemoveStub.resolves();
    fsReadFileStub.resolves('<html><head></head></html>');
    fsWriteFileStub.resolves();
    globStub
      .withArgs(options.cssDest, { cwd: options.src + '-unpacked' })
      .resolves([]);

    try {
      await main.injectCss(options);
    } catch (error) {
      expect(error.exitCode).to.equal(1);
    }
  });

  it('should exit if HTML path cannot be located', async () => {
    const options = {
      product: undefined,
      theme: undefined,
      help: undefined,
      html: 'index.html',
      src: 'app.asar',
      srcBin: undefined,
      css: 'style.css',
      cssDest: 'css-dest',
      verbose: undefined,
      yes: true,
    };
    asarExtractAllStub.returns();
    asarCreatePackageStub.resolves();
    fsCopyStub.resolves();
    fsRemoveStub.resolves();
    fsReadFileStub.resolves('<html><head></head></html>');
    fsWriteFileStub.resolves();
    globStub
      .withArgs(options.cssDest, { cwd: options.src + '-unpacked' })
      .resolves(['some-path']);
    globStub
      .withArgs(options.html, { cwd: options.src + '-unpacked' })
      .resolves([]);

    try {
      await main.injectCss(options);
    } catch (error) {
      expect(error.exitCode).to.equal(1);
    }
  });

  it('should gracefully handle missing HEAD tags', async () => {
    const options = {
      product: undefined,
      theme: undefined,
      help: undefined,
      html: '',
      src: '',
      srcBin: undefined,
      css: '',
      cssDest: '',
      verbose: undefined,
      yes: true,
    };
    asarExtractAllStub.returns();
    asarCreatePackageStub.resolves();
    fsCopyStub.resolves();
    fsRemoveStub.resolves();
    fsReadFileStub.resolves('');
    fsWriteFileStub.resolves();
    globStub.resolves(['some-path']);

    await main.injectCss(options);

    expect(asarCreatePackageStub).to.have.been.called;
    expect(asarExtractAllStub).to.have.been.called;
  });

  it('should not inject link tag if HTML already has one', async () => {
    const options = {
      product: undefined,
      theme: undefined,
      help: undefined,
      html: 'index.html',
      src: 'app.asar',
      srcBin: undefined,
      css: 'style.css',
      cssDest: 'css-dest',
      verbose: undefined,
      yes: true,
    };
    asarExtractAllStub.returns();
    asarCreatePackageStub.resolves();
    fsCopyStub.resolves();
    fsRemoveStub.resolves();
    fsReadFileStub.resolves(`
      <html>
        <head>
          <link href="some-css-path/style.css">
        </head>
      </html>
    `);
    fsWriteFileStub.resolves();
    globStub
      .withArgs(options.cssDest, { cwd: options.src + '-unpacked' })
      .resolves(['some-css-path']);
    globStub
      .withArgs(options.html, { cwd: options.src + '-unpacked' })
      .resolves(['some-html-path']);

    await main.injectCss(options);

    expect(fsWriteFileStub).to.not.have.been.called;
  });
});
