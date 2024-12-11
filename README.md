# gpts-files

## Description
`gpts-files` is a CLI tool for managing files for OpenAI GPTs.

## Installation

### Using npm
```sh
npm install -g gpts-files
```

## Usage

### Development
To run the CLI tool in development mode:
```sh
deno task dev
```

### Compilation
To compile the CLI tool for different platforms:
```sh
deno task compile
```

This will generate the binaries in the `dist` directory for the following platforms:
- Linux x86_64
- Linux ARM64
- macOS x86_64
- macOS ARM64

## Commands
To see the available commands and options, run:
```sh
gpts-files --help
```

## Configuration

### `deno.json`
This file contains the configuration for Deno tasks, formatting options, compiler options, and module imports.

### `package.json`
This file contains the npm configuration for the project, including the binary entry point and files to include.

