const fs = require('fs-extra');

const asar = require('asar');
const chalk = require('chalk');
const glob = require('glob-promise');
const { parse } = require('node-html-parser');

const { getFileName } = require('./utils');
const { Logger } = require('./logger');

const logger = new Logger();

const injectCss = async (o) => {
  logger.showVerbose = o.verbose;

  await verifyOptions(o);

  logger.verbose('Configuration:');
  logger.verbose(o);

  await backupAsar(o.src);
  extractAsar(o.src, o.srcBin);

  const cssRef = await saveCss(o.srcBin, o.cssDest, o.css);
  await insertLinkToCssInHtml(o.srcBin, o.html, cssRef);

  repackAsar(o.srcBin, o.src);
  // TODO: I keep getting this in console when cleanUpOldFiles is not commented
  // (node:1180) UnhandledPromiseRejectionWarning: Error: ENOENT: no such file or directory, lstat 'path_to_the_unpacked_asar'
  // Disabled, till this error message can be figured out.
  // await cleanUpOldFiles(o.srcBin);

  logger.log(`${chalk.green.bold('SUCCESS!')}`); // TODO: Provide more information
  return true;
};

const verifyOptions = async (options) => {
  if (!options.srcBin) {
    options.srcBin = options.src + '-unpacked';
  }
};

const backupAsar = async (src) => {
  const dest = `${src}.bak`;
  logger.verbose(chalk`Creating backup of {blue ${src}} at {blue ${dest}}.`);
  await fs.copy(src, dest);
};

const extractAsar = (asarPath, dest) => {
  logger.verbose(chalk`Extracting {blue ${asarPath}} to {blue ${dest}}.`);
  asar.extractAll(asarPath, dest);
};

const saveCss = async (srcBin, cssDestGlob, cssSrc) => {
  logger.verbose(
    chalk`Looking for places to output css that match glob {cyan ${cssDestGlob}}.`
  );

  const possibleCssDestinations = await glob(cssDestGlob, { cwd: srcBin });
  if (possibleCssDestinations.length === 0) {
    logger.error(chalk`{red 0} output locations found.`);
    process.exit(1);
  } else {
    logger.verbose(
      chalk`{green ${possibleCssDestinations.length}} output location(s) found. Using first matching location.`
    );
  }

  const cssFileName = getFileName(cssSrc);
  const cssDest = possibleCssDestinations[possibleCssDestinations.length - 1];
  const copyCssTo = `${srcBin}/${cssDest}/${cssFileName}`;
  logger.verbose(chalk`Saving {blue ${cssSrc}} to {blue ${copyCssTo}}`);
  await fs.copy(cssSrc, copyCssTo);
  return `${cssDest}/${cssFileName}`;
};

const insertLinkToCssInHtml = async (srcBin, htmlGlob, cssRef) => {
  logger.verbose(
    chalk`Looking for html files in {blue ${srcBin}} with glob of {cyan ${htmlGlob}}`
  );

  const possibleHtmlFiles = await glob(htmlGlob, { cwd: srcBin });
  if (possibleHtmlFiles.length === 0) {
    logger.error(
      chalk`{red 0} html destinations found for html glob {cyan ${htmlGlob}}`
    );
    process.exit(1);
  }
  logger.verbose(
    chalk`{green ${possibleHtmlFiles.length}} html file(s) found.`
  );

  // generate the path to the HTML file
  const partialHtmlPath = possibleHtmlFiles[possibleHtmlFiles.length - 1];
  const htmlPath = `${srcBin}/${partialHtmlPath}`;

  logger.verbose(chalk`Reading {blue ${htmlPath}}.`);
  const htmlFile = await fs.readFile(htmlPath, 'utf8');
  logger.verbose(chalk`Parsing {blue ${htmlPath}}.`);
  const root = parse(htmlFile);
  const head = root.querySelector('head');
  if (!head) {
    logger.verbose(chalk`Head tag {yellow not found}, skipping.`);
    return;
  }

  // Check if css file is already linked
  logger.verbose(
    chalk`Head tag {green found}, adding css reference {cyan ${cssRef}} to {blue ${htmlPath}}.`
  );
  const existingLinkTag = head.querySelector(`link[href="${cssRef}"]`);
  if (existingLinkTag) {
    logger.verbose(
      chalk`Link to stylesheet skipped, {cyan ${cssRef}}, already found.`
    );
    return;
  }

  // If not already linked, then link it and save.
  const linkTag = parse(`<link rel="stylesheet" href="${cssRef}">`);
  head.appendChild(linkTag);
  logger.verbose(chalk`Stylesheet, {blue ${cssRef}}, linked in HTML.`);
  await fs.writeFile(htmlPath, root.toString(), 'utf8');
  logger.verbose(chalk`Saved updated HTML to {blue ${htmlPath}}.`);
};

const repackAsar = (src, dest) => {
  logger.verbose(chalk`Repacking {blue ${src}} to {blue ${dest}}.`);
  asar.createPackage(src, dest);
};

// TODO: Fix or remove
// eslint-disable-next-line no-unused-vars
const cleanUpOldFiles = async (srcBin) => {
  logger.verbose(chalk`Removing temporary src bin {blue ${srcBin}}.`);
  await fs.remove(srcBin);
};

module.exports = { injectCss };
