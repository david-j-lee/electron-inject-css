# Electron Inject CSS

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/david-j-lee/electron-inject-css)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)

Node CLI to inject a CSS file into an asar file. Running this program will
modify your files on disk.

## Usage

Run without having to install anything with `npx electron-inject-css`.

### Options

- `--help` | `-h` Shows this help message
- `--html` Glob path to the HTML file in the unpacked asar
- `--src` Glob path to the asar file
- `--src-bin` Path to where the asar file will be unpacked too
- `--style` Path to the css file to be injected
- `--style-dest` Glob path to where the css will be stored in unpacked asar
- `--verbose` | `-v` Shows more detailed logging
- `--yes` | `-y` Skips the confirmation
