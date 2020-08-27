const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const stringify = require('stringify-object');

const getPath = (p) => path.resolve('./', p);
const isEmpty = (s, name) => s && s.trim().length > 0 ? true : `${name} cannot be empty.`;
const isPathValid = (s) => {
    const r = isEmpty(s, 'Path');
    if (typeof r === 'string') return r;
    if (!fs.existsSync(getPath(s))) {
        return 'Path is invalid.';
    }
    return true;
};

class Initializer {
    async init() {
        // check config
        if (fs.existsSync(getPath('./workerpack.conf.js'))) {
            // config existed
            const answer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Config already exists, do you want to overwrite it?',
                    default: false
                }
            ]);
            if (!answer.confirm) process.exit(0);
        }
        // create config
        const configInput = await inquirer.prompt([
            {
                name: 'host',
                message: 'CloudFlare Worker host: ',
                validate: s => isEmpty(s, 'Host'),
            },
            {
                name: 'target',
                message: 'The directory you want to pack: ',
                validate: isPathValid,
            },
            {
                name: 'output',
                message: 'Output path (directory): ',
                default: './output',
                validate: s => isEmpty(s, 'Ouput path'),
            },
            {
                name: 'loader',
                message: 'Choose what files you want to load: ',
                type: 'checkbox',
                choices: [
                    {
                        name: '.js',
                        checked: true,
                    },
                    {
                        name: '.css',
                    },
                    {
                        name: '.html',
                    }
                ]
            },
        ]);

        // build config
        const config = configInput;

        // transform loader
        const loaders = [];
        config.loader.forEach((loader) => {
            loaders.push({
                ext: loader,
            });
        });
        config.loader = loaders;

        // inquire shell settings
        {
            const answer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Do you want to run some commands before packing?',
                    default: false,
                }
            ]);
            if (answer.confirm) {
                const cmdInput = await inquirer.prompt([
                    {
                        name: 'commands',
                        message: 'Enter the commands (separate with ,): '
                    }
                ]);
                if (cmdInput.commands) {
                    const commands = cmdInput.commands.split(',');
                    config.run_before_build = (commands.map((cmd) => typeof cmd === 'string' ? cmd.trim() : null)).filter((cmd) => cmd ? true : false);
                }
            }
        }
        {
            const answer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Do you want to run some commands after packing?',
                    default: false,
                }
            ]);
            if (answer.confirm) {
                const cmdInput = await inquirer.prompt([
                    {
                        name: 'commands',
                        message: 'Enter the commands (separate with ,): '
                    }
                ]);
                if (cmdInput.commands) {
                    const commands = cmdInput.commands.split(',');
                    config.run_after_build = (commands.map((cmd) => typeof cmd === 'string' ? cmd.trim() : null)).filter((cmd) => cmd ? true : false);
                }
            }
        }

        console.log(chalk.green('Here\'s your configuration: '));
        console.log(JSON.stringify(config));

        try {
            fs.writeFileSync(getPath('./workerpack.conf.js'), `module.exports = ${stringify(config, {
                indent: '  ',
                singleQuotes: true,
            })};`);
            console.log(chalk.green('Your configuration is saved.'));
        } catch (err) {
            console.log(chalk.red('Something went wrong when writing configuration.'));
            process.exit(-1);
        }
    }
}

module.exports = Initializer;