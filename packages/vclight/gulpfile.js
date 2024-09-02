const gulp = require("gulp");
const fs = require("fs");
const path = require("path");

gulp.task("post-esm-build", async () => renameJsToEjsSync("dist"));


function renameJsToEjsSync(dir) {
    // 读取目录内容
    const files = fs.readdirSync(dir);

    // 遍历目录内容
    files.forEach(file => {
        const filePath = path.join(dir, file);

        // 获取文件状态
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // 如果是目录，递归处理
            renameJsToEjsSync(filePath);
        } else if (stats.isFile() && path.extname(file) === ".js") {
            // 如果是.js文件，重命名为.ejs
            const newFilePath = path.join(dir, path.basename(file, ".js") + ".mjs");
            fs.renameSync(filePath, newFilePath);
        }
    });
}