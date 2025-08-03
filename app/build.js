import fs from 'fs'

import babel from '@babel/core'

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

// minify lib into one file
(() => {
    const lib = [
        "lib/host.js",
        "lib/functions/uniqueIdentifier.js",
        "lib/RestAPI/roster.js",
        "lib/RestAPI/version.js",
        "lib/RestAPI/units.js",
        "lib/functions/validateRoster.js",
        "lib/functions/exportRoster.js",
        "lib/widgets/warscrollHelpers.js",
        "lib/widgets/selectableItem.js",
        "lib/widgets/favorites.js",
        "lib/widgets/ability.js",
        "lib/widgets/weapon.js",
        "lib/widgets/overlay.js",
        "lib/widgets/contextMenu.js",
        "lib/widgets/displayTacticsOverlay.js",
        "lib/widgets/displayPointsOverlay.js",
        "lib/widgets/displayUpgradeOverlay.js",
        "lib/widgets/displayWeaponOverlay.js",
        "lib/widgets/draggable.js",
        "lib/widgets/header.js",
        "lib/widgets/footer.js",
        "lib/widgets/layout.js",
        "lib/functions/rosterState.js",
        "lib/functions/copyToClipboard.js"
    ];
    build(`./${outDir}/sc-lib.js`, lib);
})();

// minify pages into one file
(() => {
    const pages = [
        "pages/src/rosters.js",
        "pages/src/battle.js",
        "pages/src/tome.js",
        "pages/src/upgrades.js",
        "pages/src/tactics.js",
        "pages/src/warscroll.js",
        "pages/src/builder.js",
        "pages/src/units.js"
    ];
    build(`./${outDir}/sc-pages.js`, pages);
})();

// make new index.html for the new js files
(() => {
    const htmlFilePath = './index.html';
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