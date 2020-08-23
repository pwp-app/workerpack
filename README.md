# Workerpack

## What is Workerpack

Workerpack is a command line tool based on JavaScript, it can pack your static files into a single script which you can deploy to Cloudflare Worker.

Normally, Cloudflare Worker Sites requires $5/month, but the normal worker doesn't charge any with Free plan. So if the total size of your site files is under 1MB, you can use a smart way to pack them together and deploy it as a normal worker.

This tool is made for this purpose, you can use it to pack your small site and deploy it to Cloudflare Worker as a normal worker for free.

## How to use it

### Install

```bash
npm install workerpack -g
```

### Usage

Create a configuration file in your project directory named "workerpack.conf.js", following is a template of the configuration.

```javascript
module.exports = {
  host: '', // host of your Cloudflare Worker, like "test.pwp.worker.dev"
  target: '', // the path of a directory you want to pack
  loader: [
    {
      test: /\.js$/ // a pattern to match file name
      type: 'application/x-javascript', // specify MIME type of matched files.
    },
    // or you can set loader like this:
    {
      ext: '.js', // just set the ext of files
    }
  ],
  output: './output', // output path
  run_before_build: ['npm run build'], // command lines you want to run before build
  run_after_build: [], // command lines you want to run after build
}
```

Then you can run this command to start packing:

```bash
workerpack build
```

Also, you can set target path by command line:

```bash
workerpack build ./dist
```

In this command line, "./dist" is the path of a directory you want to pack.

Then wait the program done, and put the content of output script into your worker.

## License

MIT
