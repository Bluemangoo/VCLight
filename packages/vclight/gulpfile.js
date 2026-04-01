const gulp = require("gulp");
const fs = require("fs");
const path = require("path");

gulp.task("post-esm-build", async () => renameJsToEjsSync("dist"));
gulp.task("post-dts-build", async () => ignoreDtsImportErrors("dist"));

function renameJsToEjsSync(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);

        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            renameJsToEjsSync(filePath);
        } else if (stats.isFile() && path.extname(file) === ".js") {
            const newFilePath = path.join(dir, path.basename(file, ".js") + ".mjs");
            fs.renameSync(filePath, newFilePath);
        }
    });
}

const ignoreDependencies = [
    "@vercel/node",
    "@netlify/functions",
    "@cloudflare/workers-types",
    "@vercel/functions"
];

function ignoreDtsImportErrors(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            ignoreDtsImportErrors(filePath);
        } else if (stats.isFile() && file.endsWith(".d.ts")) {
            const content = fs.readFileSync(filePath, "utf-8");
            const newContent = content
                .split("\n")
                .map((line) => {
                    if (ignoreDependencies.some((dep) => line.endsWith(`from "${dep}";`))) {
                        return `// @ts-ignore\n${line}`;
                    }
                    return line;
                })
                .join("\n");
            fs.writeFileSync(filePath, newContent, "utf-8");
        }
    });
}
