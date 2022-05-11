"use strict";

import fs from "fs-extra";
import inquirer from "inquirer";
import path from "path";
import wget from "wget-improved";
import compressing from "compressing";
import * as logger from "../../lib/logger";
import ProgressBar from '../../lib/ProgressBar';
import chalk from "chalk";

const NODEX_TEMPLATE =
  "https://github.com/leansocket/nodex-0/archive/master.zip";

const createProject = async (projectName) => {
  const dest = path.resolve(".", projectName);
  const exists = await fs.pathExists(dest);
  if (exists) {
    const result = await inquirer.prompt({
      name: "overwrite",
      type: "confirm",
      message: "Overwrite your existed directory?",
      default: true,
    });
    if (!result.overwrite) {
      console.log(`${chalk.red(projectName)} project creation cancelled.`);
      process.exit(1);
    }
  }
  await fs.remove(dest);
  const pb = new ProgressBar('Progress', 30)
  pb.render({ completed: 0, total: 100 })
  const downloadDest = path.join(".", "master.zip");
  const download = wget.download(NODEX_TEMPLATE, downloadDest);
  download.on('progress', function(num) {
    pb.render({ completed: num * 100, total: 100 })
  })
  download.on("end", async function (output) {
    await compressing.zip.uncompress(downloadDest, path.resolve("."));
    await fs.remove(downloadDest);
    await fs.move(path.resolve("nodex-0-master"), dest);

    logger.log("\n");
    logger.log(`Successfully created ${chalk.green(projectName)}`);
    logger.log(`Get started with the following commands:\n`);
    logger.log(`$ cd ${chalk.green(projectName)}`);
    logger.log(`$ npm install`);
    logger.log("\n");
  });

  return dest;
};

export default async (projectName) => {
  const dest = await createProject(projectName);
};
