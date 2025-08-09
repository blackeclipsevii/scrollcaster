import fs from 'fs'
import process from 'process'
import babel from '@babel/core'

process.chdir('..');

const htmlFilePath = './index.html';
const outDir = 'output';
const minifyPreset = {
  presets: ["minify"],
  comments: false
};

if (!fs.existsSync(outDir))
    fs.mkdirSync(outDir);

const normalizeResources = (text) => {
    return text.replace(/(["'`])[^"'`]*\/resources\/(.*?)\1/g, (match, quote, file) => {
        return `${quote}resources/${file}${quote}`;
    });
}

const build = (outname, sourceList) => {
    if (fs.existsSync(outname)) {
        fs.rmSync(outname);
    }
    const tmpname = outname + '.tmp';
    if (fs.existsSync(tmpname)) {
        fs.rmSync(tmpname);
    }
    sourceList.forEach(filename => {
        let data = fs.readFileSync(filename);
        data = normalizeResources(data.toString());
        fs.writeFileSync(tmpname, data + '\n', { encoding: 'utf-8', flag: 'a' });
    });
    const data = babel.transformFileSync(tmpname, minifyPreset);
    if (!data.code) {
        throw `Failed to transcode ${outname}`;
    }
    fs.writeFileSync(outname, data.code);
    fs.rm(tmpname, ()=>{});
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
    const lib = ['lib/endpoint.js'].concat(getAllScriptsIn(htmlFilePath, 'head'));
    console.log(JSON.stringify(lib));
    build(`./${outDir}/sc-lib.js`, lib);
})();

// minify pages into one file
(() => {
    const pages = getAllScriptsIn(htmlFilePath, 'body');
    console.log(JSON.stringify(pages));
    build(`./${outDir}/sc-pages.js`, pages);
})();

// make new index.html for the new js files
(() => {
    let html = fs.readFileSync(htmlFilePath, 'utf-8');

    // 🧠 Helper to clean and inject new script into a specific tag
    const replaceScriptsInTag = (html, tagName, newScriptSrc) => {
        const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
        const match = html.match(regex);

        if (!match) return html;

        let tagContent = match[1];

        // Remove <script> tags with src
        tagContent = tagContent.replace(/<script\b[^>]*\bsrc=['"][^'"]+['"][^>]*>([\s\S]*?)<\/script>/gi, '');
        tagContent.repl
        // Append new script tag
        tagContent += `\n<script src="${newScriptSrc}"></script>\n`;

        // Rebuild updated tag
        return html.replace(regex, `<${tagName}>${tagContent}</${tagName}>`)
                   .replace(/^\s*$(?:\r\n?|\n)/gm, '');
    };

    // 🧼 Clean <head> and <body> sections
    html = replaceScriptsInTag(html, 'head', 'sc-lib.js');
    html = replaceScriptsInTag(html, 'body', 'sc-pages.js');

    // 💾 Save the output
    const outname = `./${outDir}/index.html`;
    if (fs.existsSync(outname))
        fs.rmSync(outname);
    fs.writeFileSync(outname, html, 'utf-8');
})();

// copy the resources to the output dir


const srcToOutput = (folderName) => {
    const sourceDir = `./${folderName}`;
    const destinationDir = `./${outDir}/${folderName}`;
    if (!fs.existsSync(destinationDir))
        fs.cpSync(sourceDir, destinationDir, {recursive: true});
}
(() => {
    srcToOutput('resources');
    srcToOutput('lib/css');
    srcToOutput('pages/css');
    if (!fs.existsSync(`./${outDir}/lib/lib.css`))
        fs.cpSync('./lib/lib.css', `./${outDir}/lib/lib.css`);
})();