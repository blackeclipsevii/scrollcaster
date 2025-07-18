import fs from 'fs'
import path from 'path'
import axios from 'axios'
import extract from 'extract-zip'

const zipUrl = 'https://github.com/BSData/age-of-sigmar-4th/archive/refs/heads/main.zip';
const zipPath = path.resolve('./main.zip');
const extractPath = path.resolve('./data');

export default async function installCatalog() {
  try {
    fs.rmSync(extractPath, { recursive: true, force: true });
    console.log('Folder deleted successfully.');
  } catch (err) {
    console.error('Error deleting folder:', err);
  }

  try {
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
