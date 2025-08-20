import fs from 'fs'
import process from 'process'

process.chdir('..');

const htmlFilePath = './index.html';
const outDir = 'output';

if (!fs.existsSync(outDir))
    fs.mkdirSync(outDir);

// make new index.html for the new js files
(() => {
    let html = fs.readFileSync(htmlFilePath, 'utf-8');
    html = html.replaceAll("./dist/lib/main.js", './bundle.js');

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