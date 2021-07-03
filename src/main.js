import fs from 'fs-extra';

import asar from 'asar';
import chalk from 'chalk';
import glob from 'glob-promise';
import { parse } from 'node-html-parser';

import { getFileName } from './utils';
import { Logger } from './logger';

const logger = new Logger();

export const injectCss = async (o) => {
  logger.showVerbose = o.verbose;

  await verifyOptions(o);

  logger.verbose('Configuration:');
  logger.verbose(o);

  await backupAsar(o.src);
  extractAsar(o.src, o.srcBin);

  const styleRef = await saveStyles(o.srcBin, o.styleDest, o.style);
  await insertLinkToStylesInHtml(o.srcBin, o.html, styleRef);

  repackAsar(o.srcBin, o.src);
  // TODO: I keep getting this in console when cleanUpOldFiles is not commented
  // (node:1180) UnhandledPromiseRejectionWarning: Error: ENOENT: no such file or directory, lstat 'path_to_the_unpacked_asar'
  // Disabled, till this error message can be figured out.
  // await cleanUpOldFiles(o.srcBin);

  logger.log(`${chalk.green.bold('SUCCESS!')}`);
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

const saveStyles = async (src, styleDestGlob, style) => {
  logger.verbose(
    chalk`Looking for places to output styles that match glob {cyan ${styleDestGlob}}.`
  );

  const styleDestinations = await glob(styleDestGlob, { cwd: src });
  if (styleDestinations.length === 0) {
    logger.error(chalk`{red 0} output locations found.`);
    process.exit(1);
  } else {
    logger.verbose(
      chalk`{green ${styleDestinations.length}} output location(s) found. Using first matching location.`
    );
  }

  const styleFileName = getFileName(style);
  const styleDest = styleDestinations[styleDestinations.length - 1];
  const copyStyleTo = `${src}/${styleDest}/${styleFileName}`;
  logger.verbose(chalk`Saving {blue ${style}} to {blue ${copyStyleTo}}`);
  await fs.copy(style, copyStyleTo);
  return `${styleDest}/${styleFileName}`;
};

const insertLinkToStylesInHtml = async (src, htmlGlob, styleSrc) => {
  logger.verbose(
    chalk`Looking for html files in {blue ${src}} with glob of {cyan ${htmlGlob}}`
  );

  const htmlPaths = await glob(htmlGlob, { cwd: src });
  if (htmlPaths.length === 0) {
    logger.error(
      chalk`{red 0} html destinations found for html glob {cyan ${htmlGlob}}`
    );
    process.exit(1);
  }
  logger.verbose(chalk`{green ${htmlPaths.length}} html file(s) found.`);

  const htmlPath = htmlPaths[htmlPaths.length - 1];
  const htmlFile = await fs.readFile(`${src}/${htmlPath}`, 'utf8');
  logger.verbose(chalk`Parsing {blue ${htmlPath}}.`);
  const root = parse(htmlFile);
  const head = root.querySelector('head');
  if (head) {
    logger.verbose(
      chalk`Head tag {green found}, adding custom style reference to ${htmlPath}.`
    );
    const existingStylesheet = head.querySelector(`link[href="${styleSrc}"]`);
    if (existingStylesheet) {
      logger.verbose(
        chalk`Link to stylesheet, {blue ${styleSrc}}, already found in HTML.`
      );
    } else {
      const newStylesheet = parse(`<link rel="stylesheet" href="${styleSrc}">`);
      head.appendChild(newStylesheet);
      logger.verbose(chalk`Stylesheet, {blue ${styleSrc}}, linked in HTML.`);
      logger.verbose(chalk`Saving updated HTML to {blue ${src}/${htmlPath}}.`);
      await fs.writeFile(`${src}/${htmlPath}`, root.toString(), 'utf8');
    }
  } else {
    logger.verbose(`Head tag not found, skipping.`);
  }
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
