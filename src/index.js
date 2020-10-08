"use strict";

const { program } = require("commander");
const { version, bin } = require("../package.json");
const path = require("path");
const chalk = require("chalk");

const [cmd] = Object.keys(bin);
program.version(version);

const mapActions = {
  init: {
    desc: "init a project.",
    examples: [`${cmd} init <projectName>`],
  },
  start: {
    desc: 'start a project.',
    examples: [`${cmd} start <projectPath>`]
  }
};

Object.keys(mapActions).forEach((key) => {
  program
    .command(key)
    .description(mapActions[key].desc)
    .action(() =>
      require(path.resolve(__dirname, `./actions/${key}`))(
        ...process.argv.slice(3)
      )
    )
    .on("--help", () => {
      console.log("");
      console.log("Example:");
      mapActions[key].examples.forEach((example) =>
        console.log("  $ " + example)
      );
    });
});

program.on("command:*", function () {
  console.error(
    chalk.red(
      "Invalid command: %s \nSee --help for a list of available commands."
    ),
    program.args.join(" ")
  );
  process.exit(1);
});

program.parse(process.argv);
