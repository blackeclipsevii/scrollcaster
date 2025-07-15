
import path from 'path';
import url from 'url';
import fs from 'fs'
import express from 'express'

import AgeOfSigmar from './packages/library/AgeOfSigmar.js';
import Army from './packages/library/Army.js';
import Roster from './packages/library/Roster.js';
import Lores from './packages/library/Lores.js';

const server = express();
const hostname = '192.168.1.213';
const port = 3000;
const directoryPath = "../age-of-sigmar-4th";
const saveData = "./saveData.json";
var libraries = null;
var ageOfSigmar = null;
var lores = null;
var armies = {};
var rosters = {};

async function saveRosters() {
  const content = JSON.stringify(rosters);
  fs.writeFile(saveData, content, err => {
    if (err) {
      console.error(err);
    } else {
      // file written successfully
    }
  });
}

function loadRosters() {
  if (fs.existsSync(saveData)) {
    const data = fs.readFileSync(saveData);
    rosters = JSON.parse(data);
  }
}

function getArmy(armyValue) {
  if (!ageOfSigmar) {
    ageOfSigmar = new AgeOfSigmar(directoryPath);
  }

  if (!lores) {
    lores = new Lores(directoryPath);
  }

  let army = null;
  if (armies[armyValue]) {
    army = armies[armyValue];
  } else {
    let i = 0;
    for (; i < libraries.length; ++i) {
      if (libraries[i].includes(armyValue)) {
        break;
      }
    }
    
    const library = libraries[i].split(' - ')[0] + '.cat';
    army = new Army(ageOfSigmar, lores, directoryPath, library);
    armies[armyValue] = army;
  }
  return army;
}

const getLibraries = (directoryPath) => {
  let files = fs.readdirSync(directoryPath);
  return files.filter(file => file.includes(' - Library') && path.extname(file).toLowerCase() === '.cat');
}

server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
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

server.get('/upgrades', (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const armyValue = decodeURI(parsedUrl.query.army);
  const army = getArmy(armyValue);
  res.end(JSON.stringify(army.upgrades));
  res.status(200);
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

  const army = getArmy(armyValue);
  
  if (unitName) {
    const unitIds = Object.getOwnPropertyNames(army.units);
    for (let i = 0; i < unitIds.length; ++i) {
      const unit = army.units[unitIds[i]];
      if (unit.name === unitName) {
        res.end(JSON.stringify(unit));
        res.status(200);
        return;
      }
    }
  }

  res.end(JSON.stringify(army.units));
});

server.get('/roster', (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.query.id) {
    const id = decodeURI(parsedUrl.query.id);
    let roster = rosters[id];
    if (!roster)
      roster = new Roster();
    let json = JSON.stringify(roster);
    console.log(`GET roster: ${roster.id}`);
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
  let current = rosters[req.body.id];
  let updated = req.body;
  if (current) {
    let names = Object.getOwnPropertyNames(req.body);
    for (let i = 0; i < names.length; ++i) {
      current[names[i]] = updated[names[i]];
    }
    rosters[req.body.id] = current;
  } else {
    rosters[req.body.id] = req.body;
  }
  res.end();
  saveRosters();
  return res.status(200);
});

server.put('/roster', (req, res) => {
  console.log(`PUT roster ${req.body.id}`)
  rosters[req.body.id] = req.body;
  res.status(200);
  res.end();
  saveRosters();
});

server.delete('/roster', (req, res) => {
  console.log("DELETE roster")
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.query.id) {
    const id = decodeURI(parsedUrl.query.id);
    delete rosters[id];
  }
  res.end();
  saveRosters();
  return res.status(200);
});

server.listen(port, hostname, () => {
  console.log(`Loading libraries...`);
  libraries = getLibraries(directoryPath);
  console.log(`Loading save data...`);
  loadRosters();
  console.log(`Server running at http://${hostname}:${port}/`);
});
