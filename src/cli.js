import arg from 'arg';
import chalk from 'chalk';
import inquirer from 'inquirer';

import { injectCss } from './main';
import { getProducts, getThemes, getTheme } from './themes';
import { normalizePath } from './utils';

const helpMessage = chalk`
{bold Usage}
  {dim $} {bold electron-inject-css} [--help | -h] [--html] [--src] [--src-bin] [--style]
                        [--style-dest] [--verbose | -v] [--yes | -y]
                        <product> <theme>

{bold Options}
  --help | -h      Shows this help message
  --html           Glob path to the HTML file in the unpacked asar
  --src            Glob path to the asar file
  --src-bin        Path to where the asar file will be unpacked too
  --style          Path to the css file to be injected
  --style-dest     Glob path to where the css will be stored in unpacked asar
  --verbose | -v   Shows more detailed logging
  --yes | -y       Skips the confirmation
`;

const args = {
  '--help': Boolean,
  '--html': String,
  '--src': String,
  '--src-bin': String,
  '--style': String,
  '--style-dest': String,
  '--verbose': Boolean,
  '--yes': Boolean,
  '-h': '--help',
  '-v': '--verbose',
  '-y': '--yes',
};

export const cli = async (args) => {
  let options = parseArgs(args);

  if (options.help) {
    showHelp();
  }

  options = await checkInputs(options);

  options = await confirmBeforeProceeding(options);

  await injectCss(options);
};

const parseArgs = (rawArgs) => {
  try {
    const a = arg(args, {
      argv: rawArgs.slice(2),
    });

    return {
      // Commands
      product: a._[0],
      theme: a._[1],

      // Flags
      help: a['--help'],
      html: a['--html'],
      src: a['--src'],
      srcBin: a['--src-bin'],
      style: a['--style'],
      styleDest: a['--style-dest'],
      verbose: a['--verbose'],
    };
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

const showHelp = () => {
  console.log(helpMessage);
  process.exit(0);
};

const checkInputs = async (options) => {
  const wizardTypeTheme = 'I would like to select a theme.';
  const wizardTypeManual = 'I would like to configure it myself.';
  const questions = [];
  if (
    !options.help &&
    !options.html &&
    !options.src &&
    !options.srcBin &&
    !options.style &&
    !options.styleDest
  ) {
    questions.push({
      type: 'list',
      name: 'wizardType',
      message: 'How you would like to inject your css?:',
      choices: [wizardTypeTheme, wizardTypeManual],
    });
  }
  const answers = await inquirer.prompt(questions);

  if (answers.wizardType === wizardTypeTheme) {
    options = await checkForTheme(options);
  }
  options = await checkForMissingArgs(options);

  return options;
};

const checkForTheme = async (options) => {
  const productQuestions = [];
  if (!options.product) {
    productQuestions.push({
      type: 'list',
      name: 'product',
      message: 'Select an application:',
      choices: getProducts(),
    });
  }
  const { product: productInput } = await inquirer.prompt(productQuestions);

  const themeQuestions = [];
  if (!options.theme) {
    const themes = getThemes(productInput);
    if (!themes || themes.length === 0) {
      console.log(`No themes found for ${productInput}.`);
      process.exit(1);
    }
    themeQuestions.push({
      type: 'list',
      name: 'theme',
      message: 'Select a theme:',
      choices: themes,
    });
  }
  const { theme: themeInput } = await inquirer.prompt(themeQuestions);

  const theme = getTheme(productInput, themeInput);
  if (!theme) {
    console.log(
      `${chalk.red.bold(
        ERROR
      )} unable to locate the theme ${themeInput} for ${productInput}`
    );
    process.exit(1);
  }

  return {
    ...options,
    ...theme,
    style: `${normalizePath(__dirname)}/themes/${productInput.toLowerCase()}/${
      theme.style
    }`,
    product: productInput,
    theme: themeInput,
  };
};

const checkForMissingArgs = async (options) => {
  const questions = [];

  if (!options.src) {
    questions.push({
      type: 'input',
      name: 'src',
      message: 'Input src to asar file.',
      default: 'app.asar',
    });
  }

  if (!options.style) {
    questions.push({
      type: 'input',
      name: 'style',
      message: 'Input path to css file.',
      default: 'style.css',
    });
  }

  if (!options.styleDest) {
    questions.push({
      type: 'input',
      name: 'styleDest',
      message: 'Input dest for css style in unpacked asar.',
      default: 'style.css',
    });
  }

  if (!options.html) {
    questions.push({
      type: 'input',
      name: 'html',
      message: 'Input path to html file in unpacked asar.',
      default: 'index.html',
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    ...answers,
  };
};

const confirmBeforeProceeding = async (options) => {
  const questions = [];
  if (!options.yes) {
    questions.push({
      type: 'confirm',
      name: 'yes',
      message: `Running this program will modify files on disk. Are you sure you want to continue?`,
    });
  }
  const answer = await inquirer.prompt(questions);
  if (!answer.yes) {
    process.exit(0);
  }
  return {
    ...options,
    yes: true,
  };
};
