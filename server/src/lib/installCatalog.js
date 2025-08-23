import fs from 'fs';
import path from 'path';
import axios from 'axios';
import extract from 'extract-zip';
const repoOwner = 'BSData';
const repoName = 'age-of-sigmar-4th';
const repoUrl = `https://github.com/${repoOwner}/${repoName}`;
const extractPath = path.resolve('./data');
export const deleteDataFolder = () => {
    try {
        fs.rmSync(extractPath, { recursive: true, force: true });
        console.log('Folder deleted successfully.');
    }
    catch (err) {
        console.error('Error deleting folder:', err);
    }
};
const getLatestCommitId = async () => {
    let commitId = 'unknown';
    await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits`)
        .then(response => {
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        return response.json();
    })
        .then(commits => {
        commitId = commits[0]?.sha;
    })
        .catch(error => {
        console.error("Error fetching commit data:", error);
    });
    return commitId;
};
const getCommitIdFromTag = async (tag) => {
    let commitId = 'unknown';
    const uri = encodeURI(`https://api.github.com/repos/${repoOwner}/${repoName}/git/ref/tags/${tag}`);
    console.log(uri);
    await fetch(uri)
        .then(res => res.json())
        .then(refData => {
        const tagUrl = refData.url;
        // Fetch the tag object to get the commit SHA
        return fetch(tagUrl);
    })
        .then(res => res.json())
        .then(tagData => {
        commitId = tagData.object.sha;
        console.log(`Commit ID for tag ${tag}:`, commitId);
    })
        .catch(err => console.error('Error fetching tag info:', err));
    return commitId;
};
export default async function installCatalog(tag, commitSha) {
    let zipUrl;
    let commitId;
    if (commitSha) {
        zipUrl = encodeURI(`${repoUrl}/archive/${commitSha}.zip`);
        commitId = commitSha;
    }
    else if (tag) {
        zipUrl = encodeURI(`${repoUrl}/archive/refs/tags/${tag}.zip`);
        commitId = await getCommitIdFromTag(tag);
    }
    else {
        zipUrl = encodeURI(`${repoUrl}/archive/refs/heads/main.zip`);
        commitId = await getLatestCommitId();
    }
    try {
        // Download the ZIP file
        const response = await axios({
            method: 'GET',
            url: zipUrl,
            responseType: 'stream',
        });
        const zipPath = path.resolve('./data.zip');
        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        console.log('Download complete.');
        // Unzip the file
        await extract(zipPath, { dir: extractPath });
        console.log('Unzip complete.');
        // Optionally delete the ZIP file
        fs.unlinkSync(zipPath);
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    return commitId;
}
