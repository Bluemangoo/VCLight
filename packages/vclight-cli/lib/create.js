const inquirer = require("inquirer");
const chalk = require("chalk");
const logSymbols = require("log-symbols");
const fs = require("fs");
const keys = {
    router: "A template project with VCLight and router",
    blank: "A blank project with VCLight",
    prettier: "Prettier",
    gitignore: "Git ignore",
    vercel: "Vercel",
    netlify: "Netlify",
    http: "Node http server"
};
const getPackageVersion = require("./getPackageVersion");
const ora = require("ora");
const path = require("path");
const ejs = require("ejs");

function isValidFolderName(str) {
    const illegalChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (str.match(illegalChars)) {
        return false;
    }
    if (str.trim() === "") {
        return false;
    }
    return str.length <= 255;

}

function toValidNpmName(str) {
    str = str.replace(/\s+/g, "-");
    str = str.replace(/[^a-zA-Z0-9-]/g, "");
    str = str.toLowerCase();
    return str;
}

function readDirAll(url, index) {
    let result = {
        path: url,
        title: path.basename(url),
        extname: "",
        deep: index,
        type: "directory",
        child: []
    };
    const res = fs.readdirSync(url);
    res.map(item => {
        const subPath = path.join(url, item);//文件相对路径
        const isDirectory = fs.statSync(subPath).isDirectory(); //是否是文件夹
        const extname = path.extname(item); //文件后缀
        if (isDirectory) { //递归继续读 过滤文件夹
            result.child.push(readDirAll(subPath, index + 1));
        }
        if (!isDirectory) { //过滤文件后缀，文件名
            result.child.push({
                path: subPath,
                title: path.basename(subPath),
                type: "file",
                deep: index + 1,
                extname
            });
        }
    });
    return result;
}

async function writeFile(fileName, data) {
    await fs.writeFile(fileName, data, async (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                // 文件或路径不存在，需要创建
                const dirs = fileName.split("/").slice(0, -1);
                let currentDir = "";
                dirs.forEach((dir) => {
                    currentDir += `${dir}/`;
                    if (!fs.existsSync(currentDir)) {
                        fs.mkdirSync(currentDir);
                    }
                });
                // 重新写入文件
                await writeFile(fileName, data);
            } else {
                console.error(err);
            }
        }
    });
}

async function writeFromTemplate(dirTree, to, template) {
    for (const dirTreeElement of dirTree) {
        if (dirTreeElement.type === "file") {
            const dir = dirTreeElement.path.split(path.sep).slice(-dirTreeElement.deep).join("/");
            if (dirTreeElement.extname === ".ejs") {
                ejs.renderFile(dirTreeElement.path, { template }, {}, function(err, str) {
                    if (str) {
                        writeFile(to + "/" + dir.slice(0, -dirTreeElement.extname.length), str);
                    }
                });
            } else {
                await writeFile(to + "/" + dir, fs.readFileSync(dirTreeElement.path));
            }
        } else {
            await writeFromTemplate(dirTreeElement.child, to, template);
        }
    }
}

module.exports = async function(name) {
    if (!isValidFolderName(name)) {
        console.log(chalk.red(logSymbols.error), chalk.red(`${name} can't be the name of a project, please retry.`));
        return;
    }
    console.log(logSymbols.info, "Creating project", chalk.cyan(name));
    let question = [
        {
            type: "list",
            name: "preset",
            message: "Pick a preset:",
            choices: [keys.router, keys.blank]
        },
        {
            type: "checkbox",
            name: "handler",
            message: "Check the platform you need:",
            choices: [keys.vercel, keys.netlify, keys.http]
        },
        {
            type: "checkbox",
            name: "features",
            message: "Check the features you need:",
            choices: [keys.prettier, keys.gitignore]
        }
    ];

    let presetChosen, handlerChosen, featuresChosen;

    await inquirer.prompt(question).then((answers) => {
        presetChosen = answers["preset"];
        handlerChosen = answers["handler"];
        featuresChosen = answers["features"];
    });

    let template = {
        router: false,
        prettier: false,
        gitignore: false,
        vercel: false,
        netlify: false,
        http: false
    };

    if (presetChosen === keys.router) {
        template.router = true;
    }

    console.log(`✨  Creating project.`);

    const spinner = ora("Creating Files...").start();

    try {
        fs.mkdirSync(name);
    } catch {
        spinner.stop();
        console.log(logSymbols.error, chalk.red("Can't create project folder, check if a project with the same name exists."));
        return;
    }

    let dependencies = ["vclight"];
    let dependenciesWithVersion = {};
    let devDependenciesWithVersion = {};
    let devDependencies = ["@types/node"];

    if (template.router) {
        dependencies[dependencies.length] = "vclight-router";
    }

    if (featuresChosen.includes(keys.prettier)) {
        template.prettier = true;
    }
    if (featuresChosen.includes(keys.gitignore)) {
        template.gitignore = true;
    }

    if (handlerChosen.includes(keys.http)) {
        template.http = true;
    }
    if (handlerChosen.includes(keys.vercel)) {
        template.vercel = true;
    }
    if (handlerChosen.includes(keys.netlify)) {
        template.netlify = true;
    }

    if (template.vercel) {
        devDependencies.push("vercel");
    }
    if (template.netlify) {
        devDependencies.push("netlify-cli");
    }
    if (template.http) {
        devDependencies.push("ts-node", "typescript", "nodemon");
    }

    const compare = (a, b) => {
        if (a.startsWith("@") && !b.startsWith("@")) {
            return -1;
        } else if (!a.startsWith("@") && b.startsWith("@")) {
            return 1;
        } else {
            return a.localeCompare(b);
        }
    };

    new Promise(() => {
        setTimeout(async () => {
            let packageJson = {
                name: toValidNpmName(name),
                version: "0.1.0",
                private: true,
                scripts: {},
                dependencies: {},
                devDependencies: {}
            };
            if (template.vercel) {
                packageJson.scripts["dev:vercel"] = "vercel dev";
            }
            if (template.netlify) {
                packageJson.scripts["dev:netlify"] = "netlify functions:serve";
            }
            if (template.http) {
                packageJson.scripts["dev:http"] = "nodemon src/httpEntry.ts";
            }
            let taskList = [];
            let deps = {};
            let devDeps = {};
            for (const dependency of dependencies) {
                taskList[taskList.length] = getPackageVersion(dependency)
                    .then((r) => deps[dependency] = "^" + r);
            }
            for (const devDependency of devDependencies) {
                taskList[taskList.length] = getPackageVersion(devDependency)
                    .then((r) => devDeps[devDependency] = "^" + r);
            }
            await Promise.all(taskList);
            for (const dependency in dependenciesWithVersion) {
                deps[dependency] = dependenciesWithVersion[dependency];
            }
            for (const dependency in devDependenciesWithVersion) {
                devDeps[dependency] = devDependenciesWithVersion[dependency];
            }
            const depKs = Object.keys(deps).sort(compare);
            const devDepKs = Object.keys(devDeps).sort(compare);
            for (const depK of depKs) {
                packageJson.dependencies[depK] = deps[depK];
            }
            for (const devDepK of devDepKs) {
                packageJson.devDependencies[devDepK] = devDeps[devDepK];
            }
            // write package.json
            fs.writeFileSync(name + "/package.json", JSON.stringify(packageJson, null, 2));

            await writeFromTemplate(readDirAll(__dirname + "/../files/", 0).child, name, template);

            spinner.stop();
            console.log(logSymbols.success, chalk.green("Created successfully."), "\n");
            console.log("run commands:");
            console.log(chalk.green("cd " + name));
            console.log(chalk.green("npm install"));
        }, 1000);
    }).catch((e) => {
        spinner.stop();
        console.log(logSymbols.error, chalk.red("Can't create files."));
        console.log(e);
    });
};