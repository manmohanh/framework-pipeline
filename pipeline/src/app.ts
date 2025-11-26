import dotenv from "dotenv";
dotenv.config();

import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import {
  appBoilerplate,
  interfaceBoilerplate,
  modelBoilerplate,
  routerBoilerplate,
} from "./util/boilerplate";
import { promisify } from "util";
const log = console.log;

const Exec = promisify(exec);

const validateService = (service: string) => {
  if (!service || service.length === 0)
    throw new Error("Service name is required");

  const regex = /^[A-Za-z0-9-]+$/;
  const isValid = regex.test(service);
  if (!isValid)
    throw new Error(
      "Space or any symbol not allowed in service name you can use hyphen(-)"
    );

  return service.toLocaleLowerCase();
};

const exitApp = (msg: string | null = null) => {
  const message = chalk.bgGreenBright.white.bold(msg || " 👋 Good Bye! ");
  log(message);
  process.exit(0);
};

const makeFolder = (path: string) => {
  const isExist = fs.existsSync(path);

  if (isExist)
    throw new Error(`${path.split("\\").pop()} service already exists !`);

  fs.mkdirSync(path);
};

const copyFiles = (files: string[], inputPath: string, outputPath: string) => {
  files.forEach((file) => {
    fs.copyFileSync(
      path.join(`${inputPath}`, file),
      path.join(`${outputPath}`, file)
    );
  });
};

const getBoilerplate = (file: string, service: string) => {
  if (file === ".router.ts") return routerBoilerplate(service);
  if (file === ".interface.ts") return interfaceBoilerplate(service);
  if (file === ".model.ts") return modelBoilerplate(service);

  return "";
};

const createFiles = (files: string[], service: string, srcPath: string) => {
  files.forEach((file) => {
    const filename = `${service}${file}`;
    const filepath = path.join(srcPath, filename);
    fs.writeFileSync(filepath, getBoilerplate(file, service));
  });
};

const updateLastPort = (pipelinePath: string, newPort: number) => {
  const envFilePath = path.join(pipelinePath, ".env");
  const envData = fs.readFileSync(envFilePath, "utf-8");

  const updatedPortString = envData.replace(
    /LAST_PORT\s*=\s*\d+/,
    `LAST_PORT = ${newPort}`
  );
  fs.writeFileSync(envFilePath, updatedPortString);
};

const createEnvForNewService = (
  pipelinePath: string,
  servicePath: string,
  newPort: number
) => {
  const pipelineEnvPath = path.join(pipelinePath, ".env");
  const newEnvPath = path.join(servicePath, ".env");
  const envData = fs.readFileSync(pipelineEnvPath, "utf-8");
  const stringChangedAfterPort = envData.replace(
    /PORT\s*=\s*\d+/,
    `PORT = ${newPort}`
  );
  const arr = stringChangedAfterPort.split("\n");
  const modifiedData = arr
    .map((item) => {
      if (item.startsWith("LAST_PORT")) return null;
      if (item.startsWith("SERVER"))
        return `SERVER = http://localhost:${newPort}\r`;

      return item;
    })
    .filter(Boolean);

  fs.writeFileSync(newEnvPath, modifiedData.join("\n"));
};

const createDockerFileForNewService = (
  pipelinePath: string,
  servicePath: string,
  newPort: number
) => {
  const pipelineDockerFilePath = path.join(pipelinePath, "Dockerfile");
  const newDockerFilePath = path.join(servicePath, "Dockerfile");
  const dockerFileData = fs.readFileSync(pipelineDockerFilePath, "utf-8");
  const replaceDockerPort = dockerFileData.replace(
    /EXPOSE\s*\d+/,
    `EXPOSE ${newPort}`
  );

  fs.writeFileSync(newDockerFilePath, replaceDockerPort);
};

const app = async () => {
  try {
    const welcomeMessage = chalk.bgMagenta.white.bold(
      "---✨ Welcome team! ✨---\n"
    );
    log(welcomeMessage);

    const { service } = await inquirer.prompt({
      type: "input",
      name: "service",
      message: chalk.yellow("Enter service name || To Exit app write :q\n"),
    });

    if (service === ":q") exitApp();

    if (service === "pipeline") exitApp("pipeline service name not allowed");

    const serviceName = validateService(service);
    const appPath = __dirname;
    const rootPath = path.resolve(appPath, "../../");
    const pipelinePath = path.resolve(appPath, "../");
    const servicePath = path.join(rootPath, serviceName);
    const srcPath = path.join(servicePath, "src");
    const appFilePath = path.join(srcPath, "app.ts");
    const filesListForCopy = ["package.json", "tsconfig.json"];

    const filesListForCreate = [
      ".controller.ts",
      ".service.ts",
      ".model.ts",
      ".interface.ts",
      ".enum.ts",
      ".middleware.ts",
      ".dto.ts",
      ".router.ts",
    ];

    const lastPort = parseInt(process.env.LAST_PORT!);
    const newPort = lastPort + 1;

    // Service folder
    makeFolder(servicePath);

    // src folder inside service folder
    makeFolder(srcPath);

    // creating app.ts

    fs.writeFileSync(
      appFilePath,
      appBoilerplate(serviceName, newPort),
      "utf-8"
    );

    // change last port in pipeline
    updateLastPort(pipelinePath, newPort);
    createEnvForNewService(pipelinePath, servicePath, newPort);
    createDockerFileForNewService(pipelinePath, servicePath, newPort);

    //copying all files for initial setup
    copyFiles(filesListForCopy, pipelinePath, servicePath);

    //creating required files for developement
    createFiles(filesListForCreate, serviceName, srcPath);

    log(chalk.bgGreen.black.bold("Installing dependencies... Please wait"));
    await Exec("npm install", { cwd: servicePath });

    log(
      chalk.bgYellow.black.bold(
        `Success - ${serviceName} created successfully !`
      )
    );

    log(chalk.bgGreen.bold(`Browse service folder and write npm run dev`));

    exitApp();
  } catch (error) {
    if (error instanceof Error)
      log(chalk.bgRed.white.bold(` 🛑 Error - ${error.message} \n`));
    app();
  }
};

app();
