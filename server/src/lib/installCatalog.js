import fs from 'fs'
import path from 'path'
import axios from 'axios'
import extract from 'extract-zip'

var commitId = null;
const zipPath = path.resolve('./main.zip');
const extractPath = path.resolve('./data');

export const getCommitIdUsed = () => {
  return commitId === null ? 'unknown' : commitId;
}

export default async function installCatalog(alternateZipUrl=null) {
  try {
    fs.rmSync(extractPath, { recursive: true, force: true });
    console.log('Folder deleted successfully.');
  } catch (err) {
    console.error('Error deleting folder:', err);
  }

  fetch("https://api.github.com/repos/BSData/age-of-sigmar-4th/commits")
  .then(response => {
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return response.json();
  })
  .then(commits => {
    commitId = commits[0]?.sha;
    console.log("Latest Commit SHA:", commitId);
  })
  .catch(error => {
    console.error("Error fetching commit data:", error);
  });

  try {
    let zipUrl = 'https://github.com/BSData/age-of-sigmar-4th/archive/refs/heads/main.zip';
    if (alternateZipUrl) {
      zipUrl = alternateZipUrl;
    }
  
    // Download the ZIP file
    const response = await axios({
      method: 'GET',
      url: zipUrl,
      responseType: 'stream',
    });

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
  } catch (error) {
    console.error('Error:', error.message);
  }
}
