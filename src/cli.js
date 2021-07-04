const os = require('os');

const arg = require('arg');
const chalk = require('chalk');
const glob = require('glob-promise');
const inquirer = require('inquirer');
const semver = require('semver');

const { injectCss } = require('./main');
const { getProducts, getThemes, getTheme } = require('./themes');
const { getDirectory, getFileName, normalizePath } = require('./utils');
const { Logger } = require('./logger');

let logger = new Logger();

const helpMessage = chalk`
{bold Usage}
  {dim $} {bold electron-inject-css} [--css | -c] [--css-dest | -d] [--help | -h] [--html | -t]
                        [--src | -s] [--src-bin | -b] [--verbose | -v] [--yes | -y]
                        <product> <theme>

{bold Options}
  --help | -h      Shows this help message
  --html | -t      Glob path to the HTML file in the unpacked asar
  --src | -s       Glob path to the asar file
  --src-bin | -b   Path to where the asar file will be unpacked too
  --css | -c       Path to the css file to be injected
  --css-dest | -d  Glob path to where the css will be stored in unpacked asar
  --verbose | -v   Shows more detailed logging
  --yes | -y       Skips the confirmation
`;

const args = {
  '--css': String,
  '--css-dest': String,
  '--help': Boolean,
  '--html': String,
  '--src': String,
  '--src-bin': String,
  '--verbose': Boolean,
  '--yes': Boolean,
  '-c': '--css',
  '-d': '--css-dest',
  '-h': '--help',
  '-t': '--html',
  '-s': '--src',
  '-b': '--src-bin',
  '-v': '--verbose',
  '-y': '--yes',
};

const cli = async (args) => {
  checkVersion();

  let options = parseArgs(args);
  logger.showVerbose = options.showVerbose;

  if (options.help) {
    showHelp();
  }

  options = await checkInputs(options);
  options = await confirmBeforeProceeding(options);

  await injectCss(options);
};

const checkVersion = () => {
  const lowestSupported = '11.0.0';
  const lowestRecommended = '12.0.0';
  const version = process.version;
  if (semver.lt(version, lowestSupported)) {
    logger.error(
      `Node version ${version} is not supported. Please install version ${lowestRecommended}+.`
    );
    process.exit(1);
  }
  if (semver.lt(version, lowestRecommended)) {
    logger.warn(`Node version ${lowestRecommended}+ is recommended.`);
  }
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
      css: a['--css'],
      cssDest: a['--css-dest'],
      verbose: a['--verbose'],
    };
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
};

const showHelp = () => {
  logger.log(helpMessage);
  process.exit(0);
};

const checkInputs = async (options) => {
  const wizardTypeTheme = 'I would like to select a theme.';
  const wizardTypeManual = 'I would like to configure it myself.';
  const questions = [];
  if (
    !options.css &&
    !options.cssDest &&
    !options.help &&
    !options.html &&
    !options.src &&
    !options.srcBin
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
      logger.log(`No themes found for ${productInput}.`);
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
    logger.error(
      `Unable to locate the theme ${themeInput} for ${productInput}.`
    );
    process.exit(1);
  }

  const src = await getSrcFromTheme(productInput, theme.src);

  return {
    ...options,
    ...theme,
    src,
    css: `${normalizePath(__dirname)}/themes/${productInput.toLowerCase()}/${
      theme.css
    }`,
    product: productInput,
    theme: themeInput,
  };
};

const getSrcFromTheme = async (product, paths) => {
  for (const path of paths) {
    // Replace %USER_HOME% with the users home directory
    let parsedPath = path;
    if (path) {
      parsedPath = path.replace('%USER_HOME%', normalizePath(os.homedir()));
    }
    // Replace the path glob with the first matching real path
    const src = getDirectory(parsedPath);
    const fileName = getFileName(parsedPath);
    const sources = await glob(src);
    if (sources.length > 0) {
      return `${sources[sources.length - 1]}/${fileName}`;
    }
  }
  const questions = [
    {
      type: 'input',
      name: 'src',
      message: `Unable to locate the path to the asar file for ${product}, please input one.`,
      default: 'app.asar',
    },
  ];
  const answer = await inquirer.prompt(questions);
  return answer.src;
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

  if (!options.css) {
    questions.push({
      type: 'input',
      name: 'css',
      message: 'Input path to css file.',
      default: 'style.css',
    });
  }

  if (!options.cssDest) {
    questions.push({
      type: 'input',
      name: 'cssDest',
      message: 'Input dest for css file in unpacked asar.',
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
      // TODO: provide a listing of expected changes
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

module.exports = { cli };
