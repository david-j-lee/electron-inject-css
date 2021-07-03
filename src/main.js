import os from 'os';
import fs from 'fs-extra';

import asar from 'asar';
import chalk from 'chalk';
import glob from 'glob-promise';
import { parse } from 'node-html-parser';

import { getDirectory, getFileName, normalizePath } from './utils';

const verifyOptions = async (options) => {
  // Replace %USER_HOME% with the users home directory
  if (options.path) {
    options.path = options.path.replace(
      '%USER_HOME%',
      normalizePath(os.homedir())
    );
  }

  // Replace the path glob with the first matching real path
  const path = getDirectory(options.path);
  const fileName = getFileName(options.path);
  const paths = await glob(path);
  if (paths.length === 0) {
    console.log(
      `${chalk.red.bold('ERROR:')} Unable to locate path ${options.path}`
    );
    process.exit(1);
  }
  options.path = `${paths[paths.length - 1]}/${fileName}`;

  if (!options.output) {
    options.output = options.path + '-unpacked';
  }
};

const backupAsar = async (path) => {
  const backupPath = `${path}.bak`;
  console.log(`Creating back up of ${path} at ${backupPath}`);
  await fs.copy(path, backupPath);
};

const extractAsar = (asarPath, dest) => {
  console.log(`Extracting ${asarPath} to ${dest}`);
  asar.extractAll(asarPath, dest);
};

const saveStyles = async (src, styleGlob, style) => {
  console.log(
    `Looking for places to output styles that match glob ${styleGlob}.`
  );
  const styleSrc = await glob(styleGlob, { cwd: src });
  console.log(
    `${styleSrc.length} output location(s) found. Use first location.`
  );
  const styleFileName = getFileName(style);
  for (const styleOutputPath of styleSrc) {
    const copyStyleTo = `${src}/${styleOutputPath}/${styleFileName}`;
    console.log(`Saving ${style} to ${copyStyleTo}`);
    await fs.copy(style, copyStyleTo);
    // only need to put style in first location found
    return `${styleOutputPath}/${styleFileName}`;
  }
};

const insertLinkToStylesInHtml = async (src, htmlGlob, styleSrc) => {
  console.log(`Looking for html files in ${src} with glob of ${htmlGlob}`);
  const htmlPaths = await glob(htmlGlob, { cwd: src });
  console.log(`${htmlPaths.length} html file(s) found.`);
  for (const htmlPath of htmlPaths) {
    const htmlFile = await fs.readFile(`${src}/${htmlPath}`, 'utf8');
    console.log(`Parsing ${htmlPath}.`);
    const root = parse(htmlFile);
    const head = root.querySelector('head');
    if (head) {
      console.log(
        `Head tag found, adding custom style reference to ${htmlPath}.`
      );
      const newStylesheet = parse(`<link rel="stylesheet" href="${styleSrc}">`);
      head.appendChild(newStylesheet);
      console.log(`Saving updated HTML to ${src}/${htmlPath}.`);
      fs.writeFile(`${src}/${htmlPath}`, root.toString(), 'utf8');
    } else {
      console.log(`Head tag not found, skipping.`);
    }
  }
};

const repackAsar = (src, dest) => {
  console.log(`Repacking ${src} to ${dest}`);
  asar.createPackage(src, dest);
};

const cleanUpOldFiles = (tmp) => {
  fs.remove(tmp);
};

export const injectCss = async (o) => {
  await verifyOptions(o);

  console.log(o);

  backupAsar(o.path);
  extractAsar(o.path, o.output);

  const styleSrc = await saveStyles(o.output, o.styleOutput, o.style);
  await insertLinkToStylesInHtml(o.output, o.html, styleSrc);

  repackAsar(o.output, o.path);
  cleanUpOldFiles(o.output);

  console.log(`${chalk.green.bold('DONE')}`);
  return true;
};
