import fs from 'fs'
import process from 'process'
import babel from '@babel/core'
import path from 'path';

process.chdir('..');

const htmlFilePath = './index.html';
const outDir = 'output';
const minifyPreset = {
  presets: ["minify"],
  comments: false
};

if (!fs.existsSync(outDir))
    fs.mkdirSync(outDir);

const build = (sourceList) => {
    sourceList.forEach(filename => {
        const outputPath = path.join(outDir, filename.replace(`dist${path.sep}`, ''));
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        let data = fs.readFileSync(filename).toString();
        const result = babel.transformSync(data, minifyPreset);
        if (!result)
            throw `Failed to transcode ${filename}`;
        fs.writeFileSync(outputPath, result.code, { encoding: 'utf-8', flag: 'a' });
    });
}

// minify dist
(() => {
    function walk(dir, fileList = []) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                walk(fullPath, fileList); // Recurse into subdirectory
            } else {
                fileList.push(fullPath); // Add file path
            }
        });

        return fileList;
    }

    const files = walk('dist');
    console.log(JSON.stringify(files));
    build(files);
})();

// make new index.html for the new js files
(() => {
    let html = fs.readFileSync(htmlFilePath, 'utf-8');
    html = html.replace('dev/endpoint', 'lib/endpoint');
    html = html.replaceAll('dist/', '');

    // 💾 Save the output
    const outname = `./${outDir}/index.html`;
    if (fs.existsSync(outname))
        fs.rmSync(outname);
    fs.writeFileSync(outname, html, 'utf-8');
    fs.copyFile('service-worker.js', `./${outDir}/service-worker.js`, () =>{});
})();

(() => {
    // copy the resources to the output dir
    const srcToOutput = (folderName) => {
        const sourceDir = `./${folderName}`;
        const destinationDir = `./${outDir}/${folderName}`;
        if (!fs.existsSync(destinationDir))
            fs.cpSync(sourceDir, destinationDir, {recursive: true});
    }

    srcToOutput('resources');
    srcToOutput('lib/css');
    srcToOutput('pages/css');
    if (!fs.existsSync(`./${outDir}/lib/lib.css`))
        fs.cpSync('./lib/lib.css', `./${outDir}/lib/lib.css`);
})();