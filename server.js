
import path from 'path';
import url from 'url';
import fs from 'fs'
import express from 'express'

import AgeOfSigmar from './packages/library/AgeOfSigmar.js'
import Unit from './packages/library/Unit.js';
import { request } from 'http';
import Roster from './packages/library/Roster.js';

const server = express();
const hostname = '127.0.0.1';
const port = 3000;
const directoryPath = "../age-of-sigmar-4th";
var libraries;
var rosters = {};

const getLibraries = (directoryPath) => {
  let files = fs.readdirSync(directoryPath);
  return files.filter(file => file.includes(' - Library') && path.extname(file).toLowerCase() === '.cat');
}

server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
server.use(express.json());

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
  units.sort((a, b) => a.type - b.type);
  res.end(JSON.stringify(units));
});

server.get('/roster', (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.query.id) {
    const id = decodeURI(parsedUrl.query.id);
    let roster = rosters[id];
    if (!roster)
      roster = new Roster();
    let json = JSON.stringify(roster);
    console.log('GET roster: '+ json);
    res.end(json);
  } else {
    let names = Object.getOwnPropertyNames(rosters);
    let result = [];
    for (let i = 0; i < names.length; ++i) {
      if (rosters[names[i]].hidden)
        continue;
      result.push(names[i]);
    }
    let json = JSON.stringify(result);
    console.log('GET roster list: ' + json);
    res.end(json);
  }
  res.status(200);
});

server.post('/roster', (req, res) => {
  console.log("POST roster")
  const parsedUrl = url.parse(req.url, true);
  const id = decodeURI(parsedUrl.query.id);
  let current = rosters[id];
  let updated = req.body;
  if (current) {
    let names = Object.getOwnPropertyNames(req.body);
    for (let i = 0; i < names.length; ++i) {
      current[names[i]] = updated[names[i]];
    }
    rosters[id] = current;
  } else {
    rosters[id] = req.body;
  }
  res.end();
  return res.status(200);
});

server.put('/roster', (req, res) => {
  console.log("PUT roster")
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.query.id) {
    const id = decodeURI(parsedUrl.query.id);
    rosters[id] = req.body;
  }
  res.end();
  return res.status(200);
});

server.listen(port, hostname, () => {
  libraries = getLibraries(directoryPath);
  console.log(`Server running at http://${hostname}:${port}/`);
});
