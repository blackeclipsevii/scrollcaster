
import path from 'path';
import url from 'url';
import fs from 'fs'
import express from 'express'

import AgeOfSigmar from './packages/library/AgeOfSigmar.js'
import Unit from './packages/library/Unit.js';

const server = express();
const hostname = '127.0.0.1';
const port = 3000;
const directoryPath = "./age-of-sigmar-4th-main";
var libraries;

const getLibraries = (directoryPath) => {
  let files = fs.readdirSync(directoryPath);
  return files.filter(file => file.includes(' - Library') && path.extname(file).toLowerCase() === '.cat');
}

server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

server.get('/armies', (_, res) => {
  let result = [];
  libraries.forEach((_, index) => {
    let lib =  libraries[index];
    result.push(lib.split(' - ')[0]);
  });
  res.end(JSON.stringify(result));
});

server.get('/units', (req, res) => {
  const parsedUrl = url.parse(req.url, true); // 'true' parses the query string
  const armyValue = decodeURI(parsedUrl.query.army);
  let unitName = null;
  
  if (parsedUrl.query.name) {
    unitName = decodeURI(parsedUrl.query.name);
    console.log(`Unit requested: ${armyValue} ${unitName}`);
  } else {
    console.log(`Army requested: ${armyValue}`);
  }

  let i = 0;
  for (; i < libraries.length; ++i) {
    if (libraries[i].includes(armyValue)) {
      break;
    }
  }
  
  const filename = directoryPath + "\\" + libraries[i];
  if (!fs.existsSync(filename)) {
    console.log('file doesnt exist');
  }
  
  const xmlContent = fs.readFileSync(filename, 'utf8');
  const aos = new AgeOfSigmar(xmlContent);
  let units = [];
  if (aos.isValid) {
    const entries = aos.root.catalogue.sharedSelectionEntries;
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];
      if (entry['@type'] === 'unit') {
        const unit = new Unit(entry);
        if (unitName && unit.name === unitName) {
          res.end(JSON.stringify(unit));
          return;
        }
        units.push(unit);
      }
    }
  }

  res.end(JSON.stringify(units));
});

server.listen(port, hostname, () => {
  libraries = getLibraries(directoryPath);
  console.log(`Server running at http://${hostname}:${port}/`);
});
