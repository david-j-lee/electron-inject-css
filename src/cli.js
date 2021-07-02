import arg from 'arg';
import inquirer from 'inquirer';
import { injectCss } from './main';

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
    path: args['--path'],
    output: args['--output'],
    style: args['--style'],
    styleOutput: args['--style-output'],
    html: args['--html'],
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

export const cli = async (args) => {
  let options = parseArgs(args);
  options = await checkForMissingArgs(options);
  await injectCss(options);
};
