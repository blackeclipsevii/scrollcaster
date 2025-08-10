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
        const outputPath = path.join(outDir, filename.replace('dist/', ''));
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        let data = fs.readFileSync(filename);
        const result = babel.transformSync(data, minifyPreset);
        if (!result)
            throw `Failed to transcode ${filename}`;
        fs.writeFileSync(outputPath, result.code, { encoding: 'utf-8', flag: 'a' });
    });
}

// determine what to minify from the development html
// removes any dev scripts
const getAllScriptsIn = (htmlFile, tag) => {
    // Read the HTML file
    const html = fs.readFileSync(htmlFile, 'utf-8');

    // Match all <script> tags in the <head>
    let content;
    if (tag.toLowerCase() === 'head')
        content = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
    else
        content = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';

    const scriptSrcs = Array.from(content.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi))
                       .map(match => match[1])
                       .filter(src => !src.includes('dev/'));

    return scriptSrcs;
}

// minify lib into one file
(() => {
    const endpointfile = 'lib/endpoint.js';
    const lib = [endpointfile].concat(getAllScriptsIn(htmlFilePath, 'head'));
    console.log(JSON.stringify(lib));
    build(lib);
    fs.rename(`${outDir}/lib`, `${outDir}/app/dev`, ()=>{});
})();

// minify pages into one file
(() => {
    const pages = getAllScriptsIn(htmlFilePath, 'body');
    console.log(JSON.stringify(pages));
    build(pages);
})();

// make new index.html for the new js files
(() => {
    let html = fs.readFileSync(htmlFilePath, 'utf-8');
    html = html.replaceAll('dist/app', '');

    // 💾 Save the output
    const outname = `./${outDir}/app/index.html`;
    if (fs.existsSync(outname))
        fs.rmSync(outname);
    fs.writeFileSync(outname, html, 'utf-8');
})();

(() => {
    // copy the resources to the output dir
    const srcToOutput = (folderName) => {
        const sourceDir = `./${folderName}`;
        const destinationDir = `./${outDir}/app/${folderName}`;
        if (!fs.existsSync(destinationDir))
            fs.cpSync(sourceDir, destinationDir, {recursive: true});
    }

    srcToOutput('resources');
    srcToOutput('lib/css');
    srcToOutput('pages/css');
    if (!fs.existsSync(`./${outDir}/app/lib/lib.css`))
        fs.cpSync('./lib/lib.css', `./${outDir}/app/lib/lib.css`);
})();