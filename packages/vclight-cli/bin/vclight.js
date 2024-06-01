#!/usr/bin/env node

"use strict";

const { program } = require("commander");
const minimist = require("minimist");
const chalk = require("chalk");

program.usage("<command>");

program
    .version(require("../package.json").version)
    .description("VCLight Cli");


program
    .command("create <project-name>")
    .description("Create a project with VCLight")
    .action(async (name) => {
        if (minimist(process.argv.slice(3))._.length > 1) {
            console.log(chalk.yellow("\n Info: You provided more than one argument. The first one will be used as the app's name, the rest are ignored."));
        }
        await require("../lib/create")(name);
    });

program.parse(process.argv);