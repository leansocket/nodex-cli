#!/usr/bin/env node

const libs = require('nodex-libs');
const program = require('commander');

program.version(require('../package').version, '-v, --version');

program.command('init <name>').action((name) => {
    console.log(name);
});

program.parse(process.argv);
