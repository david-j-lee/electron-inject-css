import arg from 'arg';
import inquirer from 'inquirer';
import { injectCss } from './main';
import { getProducts, getThemes, getTheme } from './themes';
import { normalizePath } from './utils';

export const cli = async (args) => {
  let options = parseArgs(args);
  options = await checkForTheme(options);
  options = await checkForMissingArgs(options);
  await injectCss(options);
};

const parseArgs = (rawArgs) => {
  const args = arg(
    {
      '--path': String,
      '--output': String,
      '--style': String,
      '--style-output': String,
      '--html': String,
      '-p': '--path',
      '-o': '--output',
      '-s': '--style',
      '-y': '--style-output',
      '-h': '--html',
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  return {
    product: args._[0],
    theme: args._[1],
    path: args['--path'],
    output: args['--output'],
    style: args['--style'],
    styleOutput: args['--style-output'],
    html: args['--html'],
  };
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

  if (!options.path) {
    questions.push({
      type: 'input',
      name: 'path',
      message: 'Input path to asar file.',
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

  if (!options.styleOutput) {
    questions.push({
      type: 'input',
      name: 'style output',
      message: 'Input path to output css to.',
      default: 'style.css',
    });
  }

  if (!options.html) {
    questions.push({
      type: 'input',
      name: 'html',
      message: 'Input path to html file.',
      default: '**/*.html',
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    ...options,
    ...answers,
  };
};
