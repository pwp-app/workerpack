const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const dayjs = require('dayjs');
const shell = require('shelljs');
const mime = require('mime');

const getPath = (p) => path.resolve('./', p);

class Builder {
    constructor(path) {
        // build path
        this.root = getPath('');

        this.configPath = getPath('./workerpack.conf.js');

        // check config
        if (!fs.existsSync(this.configPath)) {
            console.log(chalk.red('Cannot find config file'));
            process.exit(-1);
        }

        this.config = require(this.configPath);

        // init
        const { host, target, loader } = this.config;
        if (target) this.path = target;
        if (path) this.path = getPath(path);

        // check path
        if (!this.path) {
            console.log(chalk.red('Target path cannot be empty.'));
        }

        if (!fs.existsSync(this.path)) {
            console.log(chalk.red('Cannot find the target path.'));
            process.exit(-1);
        }

        const stat = fs.statSync(this.path);

        if (!stat.isDirectory()) {
            console.log(chalk.red('Target path is not a directory.'));
            process.exit(-1);
        }

        // check config

        if (!host) {
            console.log(chalk.red('Cannot find host in config file'));
            process.exit(-1);
        }
        if (!loader || !Array.isArray(loader)) {
            console.log(chalk.red( 'Cannot find loader in config file'));
            process.exit(-1);
        }

        this.host = host;
        this.loader = loader;

        // init objects
        this.assets = {};

        // generate mime map
        this.mime = {};
        this.mimeMap = {};
        let index = 0;

        this.loader.forEach((loader) => {
            let type;
            if (loader.test && loader.type) {
                type = loader.type;
            } else if (loader.ext) {
                type = mime.getType(loader.ext);
            } else {
                console.log(chalk.red('Cannot resolve the loader, please check you config.'));
                process.exit(-1);
            }
            if (!this.mime[type]) {
                this.mime[type] = index;
                this.mimeMap[index] = type;
                index++;
            }
        });

        // run command lines before build
        const { run_before_build } = this.config;
        if (run_before_build && Array.isArray(run_before_build)) {
            run_before_build.forEach((cmd) => {
                if (typeof cmd === 'string') {
                    console.log(chalk.gray(`Running command before build: [${cmd}]`));
                    shell.exec(cmd);
                }
            });
        }

        this.read(this.path);
    }
    read(p) {
        const files = fs.readdirSync(p);
        files.forEach((file) => {
            const filePath = path.join(p, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.read(filePath);
            } else if (stat.isFile()) {
                this.loader.forEach((loader) => {
                    if (loader.test) {
                        if (loader.test.test(filePath)) {
                            this.assets[filePath.replace(this.path, '').replace(/\\/g, '/')] = {
                                c: fs.readFileSync(filePath, {
                                    encoding: 'utf-8',
                                }),
                                t: this.mime[loader.type],
                            };
                        }
                    } else if (loader.ext) {
                        if (filePath.endsWith(loader.ext)) {
                            this.assets[filePath.replace(this.path, '').replace(/\\/g, '/')] = {
                                c: fs.readFileSync(filePath, {
                                    encoding: 'utf-8',
                                }),
                                t: this.mime[mime.getType(loader.ext)],
                            };
                        }
                    } else {
                        console.log(chalk.red('Cannot resolve the loader, please check you config.'));
                        process.exit(-1);
                    }
                });
            }
        });
    }
    build() {
        // read template
        const templatePath = path.resolve(__dirname, '../template.js');

        if (!fs.existsSync(templatePath)) {
            console.log(chalk.red('Cannot find template.'));
            process.exit(-1);
        }

        let template = fs.readFileSync(templatePath, {
            encoding: 'utf-8',
        });

        template = template.replace('__CF_HOST__', this.host);
        template = template.replace('__CF_SITE_DATA__', JSON.stringify(this.assets));
        template = template.replace('__CF_MIME__', JSON.stringify(this.mimeMap));

        const { output } = this.config;

        if (output && !fs.existsSync(output)) {
            console.log(chalk.red('Output path is not exist.'));
        }

        if (!output && !fs.existsSync(getPath('./output'))) {
            fs.mkdirSync(getPath('./output'));
        }

        const outputFile = `cf-worker.${dayjs().format('YYYYMMDDHHmmss')}.js`;
        let outputPath;

        if (output) {
            outputPath = getPath(output.endsWith('/') ? `${output}${outputFile}` : `${output}/${outputFile}`);
        }

        try {
            fs.writeFileSync(outputPath, template);
        } catch (err) {
            console.error(chalk.red('Failed to write file.'));
            return;
        }

        // check file size
        const outputStat = fs.statSync(outputPath);
        if (outputStat) {
            const size = outputStat.size / 1024 / 1024;
            if (size >= 1) {
                console.log(chalk.yellow('Warning: the output file size is over 1MB, it may touch the limit of Cloudflare Worker free plan.'));
            }
        }

        this.afterBuild();
    }
    afterBuild() {
        // run command lines after build
        const { run_after_build } = this.config;
        if (run_after_build && Array.isArray(run_after_build)) {
            run_after_build.forEach((cmd) => {
                if (typeof cmd === 'string') {
                    console.log(chalk.gray(`Running command after build: [${cmd}]`));
                    shell.exec(cmd);
                }
            });
        }

        // print tip
        console.log(chalk.green('Packing is done, you can paste the script to Cloudflare Worker now!'));
    }
}

module.exports = Builder;