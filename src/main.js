import asar from 'asar';
import chalk from 'chalk';
import fs from 'fs-extra';
import glob from 'glob-promise';
import { parse } from 'node-html-parser';

const saveStylesToUnpackedAsar = async (output, styleOutput, style) => {
  console.log(`Looking for places to output styles that match glob ${style}.`);
  const styleOutputPaths = await glob(styleOutput, { cwd: output });
  console.log(`${styleOutputPaths.length} output location(s) found.`);
  for (const styleOutputPath of styleOutputPaths) {
    const stylePath = style.split('/');
    const styleFileName = stylePath.pop();
    const copyStyleTo = `${output}/${styleOutputPath}/${styleFileName}`;
    console.log(`Saving ${style} to ${copyStyleTo}`);
    await fs.copy(style, copyStyleTo);
    // only need to put style in first location found
    return `${styleOutputPath}/${styleFileName}`;
  }
};

const updateHtmlFiles = async (output, htmlGlob, styleOutput) => {
  console.log(`Looking for html files in ${output} with glob of ${htmlGlob}`);
  const htmlPaths = await glob(htmlGlob, { cwd: output });
  console.log(`${htmlPaths.length} html file(s) found.`);
  for (const htmlPath of htmlPaths) {
    const htmlFile = await fs.readFile(`${output}/${htmlPath}`, 'utf8');
    console.log(`Parsing ${htmlPath}.`);
    const parsedHtml = parse(htmlFile);
    const headTag = parsedHtml.querySelector('head');
    if (headTag) {
      console.log(
        `Head tag found, adding custom style reference to ${htmlPath}.`
      );
      console.log(styleOutput);
      headTag.appendChild(`<link rel="stylesheet" href="${styleOutput}">`);
      console.log(`Saving updated HTML to ${output}/${htmlPath}.`);
      fs.writeFile(`${output}/${htmlPath}`, parsedHtml.toString(), 'utf8');
    } else {
      console.log(`Head tag not found, skipping.`);
    }
  }
};

export const injectCss = async (options) => {
  if (!options.output) {
    options.output = options.path + '-unpacked';
  }

  const backupPath = `${options.path}.bak`;
  console.log(`Creating back up of ${options.path} at ${backupPath}`);
  await fs.copy(options.path, backupPath);

  console.log(`Extracting ${options.path} to ${options.output}`);
  asar.extractAll(options.path, options.output);

  const styleOutput = await saveStylesToUnpackedAsar(
    options.output,
    options.styleOutput,
    options.style
  );

  await updateHtmlFiles(options.output, options.html, styleOutput);

  asar.createPackage(options.output, options.path);

  console.log(`${chalk.green.bold('DONE')}`);
  return true;
};
