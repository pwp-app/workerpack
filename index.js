#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const package = require('./package.json');
program.version(package.version);

const Builder = require('./src/builder');

console.log(chalk.blue(`Workerpack (${package.version})`));
console.log(chalk.blue('Created by pwp.app'));

program
    .command('build [target]')
    .description('Pack your static files into a single script')
    .action((target) => {
        if (!target) {
            console.log(chalk.red('Target path cannot be empty'));
            process.exit(-1);
        }
        const builder = new Builder(target);
        builder.build();
    });

program.parse(process.argv);