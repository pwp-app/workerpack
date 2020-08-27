#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const package = require('./package.json');

program.version(package.version);

const Builder = require('./src/builder');
const Initializer = require('./src/initializer');

console.log(chalk.blue(`Workerpack (${package.version})`));
console.log(chalk.blue('Created by pwp.app'));

program
    .command('build [target]')
    .description('Pack your static files into a single script')
    .action((target) => {
        const builder = new Builder(target);
        builder.build();
    });

program
    .command('init')
    .description('Init configuration for your project')
    .action(() => {
        const initializer = new Initializer();
        initializer.init();
    });

program.parse(process.argv);