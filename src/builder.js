const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const getPath = (p) => path.resolve('./', p);

class Builder {
    constructor(path) {
        // build path
        this.root = getPath('');
        this.path = getPath(path);
        this.configPath = getPath('./workerpack.conf.js');

        // check path
        if (!fs.existsSync(this.path)) {
            console.log(chalk.red('Cannot find the target path.'));
            process.exit(-1);
        }

        const stat = fs.statSync(this.path);
        if (!stat.isDirectory()) {
            console.log(chalk.red('Target path is not a directory.'));
            process.exit(-1);
        }

        // init
        this.assets = {};

        // check config
        if (!fs.existsSync(this.configPath)) {
            console.log(chalk.red('Cannot find config file'));
            process.exit(-1);
        }

        this.config = require(this.configPath);

        // init
        const { host, loader } = this.config;
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

        // 生成mime map
        this.mime = {};
        this.mimeMap = {};
        let index = 0;
        for (const item of loader) {
            if (!this.mime[item.type]) {
                this.mime[item.type] = index;
                this.mimeMap[index] = item.type;
                index++;
            }
        }

        this.read(this.path);
    }
    read(p) {
        const files = fs.readdirSync(p);
        for (let file of files) {
            const filePath = path.join(p, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.read(filePath);
            } else if (stat.isFile()) {
                for (let loader of this.loader) {
                    if (loader.test.test(filePath)) {
                        this.assets[filePath.replace(this.path, '').replace(/\\/g, '/')] = {
                            c: fs.readFileSync(filePath, {
                                encoding: 'utf-8',
                            }),
                            t: this.mime[loader.type],
                        };
                    }
                }
            }
        }
    }
    build() {
        // 读取template
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

        fs.writeFileSync(getPath(output ? output : './output/cf-worker.js'), template);
        console.log(chalk.green('Done'));
    }
}

module.exports = Builder;