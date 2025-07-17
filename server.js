
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

function getAgeOfSigmar() {
  if (!ageOfSigmar) {
    ageOfSigmar = new AgeOfSigmar(directoryPath);
  }
  return ageOfSigmar;
}

function getArmy(armyValue) {
  const aos = getAgeOfSigmar();

  if (!lores) {
    lores = new Lores(directoryPath);
  }

  let army = null;
  if (armies[armyValue]) {
    army = armies[armyValue];
  } else {
    let i = 0;
    for (; i < libraries.length; ++i) {
      if (libraries[i].includes(`${armyValue}.cat`)) {
        break;
      }
    }
    
    army = new Army(aos, lores, directoryPath, libraries[i]);
    army.name = armyValue;
    armies[armyValue] = army;
  }
  return army;
}

const getLibraries = (directoryPath) => {
  const catFiles = fs.readdirSync(directoryPath)
  .filter(file => {
    const lc = file.toLowerCase();
    console.log(lc);
    return (
      path.extname(lc) === '.cat' &&
      !lc.includes('- library') &&
      !lc.includes('legends]') &&
      !lc.includes('path to glory') &&
      !lc.includes('lores.cat') &&
      !lc.includes('regiments of renown')
    );
  });
  console.log (catFiles);
  return catFiles;
}

server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
server.use(express.json());

server.get('/tactics', (req, res) => {
  const aos = getAgeOfSigmar();
  res.end(JSON.stringify(aos.battleTacticCards));
  res.status(200);
});

server.get('/armies', (_, res) => {
  let result = [];
  libraries.forEach((_, index) => {
    let lib =  libraries[index];
    result.push(lib.split('.')[0]);
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
  let units = null;
  if (parsedUrl.query.army) {
    const armyValue = decodeURI(parsedUrl.query.army);
    console.log(`Army requested: ${armyValue}`);

    const army = getArmy(armyValue);
    if (!army) {
      res.status(404);
      return;
    }

    units = army.units;
  } else {
    const aos = getAgeOfSigmar();
    units = aos.units;
  }
  
  if (parsedUrl.query.name) {
    const unitName = decodeURI(parsedUrl.query.name);
    console.log(`Unit requested: ${unitName}`);
    const unitIds = Object.getOwnPropertyNames(units);
    for (let i = 0; i < unitIds.length; ++i) {
      const unit = units[unitIds[i]];
      if (unit.name === unitName) {
        res.end(JSON.stringify(unit));
        return;
      }
    }
  } 
  
  if (parsedUrl.query.id) {
    console.log(`Unit requested: ${parsedUrl.query.id}`);
    const unit = units[parsedUrl.query.id];
    if (unit) {
      console.log(`Unit found.`);
      res.end(JSON.stringify(unit));
    } else {
      console.log(`Unit not found.`);
      res.status(404);
      res.end();
    }
    return;
  }

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
    console.log(`GET roster: ${roster.id}`);
    res.end(json);
  } 
  else if (parsedUrl.query.army) {
    const armyValue = decodeURI(parsedUrl.query.army);
    console.log(`army value: ${armyValue}`)
    const army = getArmy(armyValue);
    if (!army) {
      res.status(404);
      return;
    }
    let roster = new Roster(army);
    let json = JSON.stringify(roster);
    console.log(`GET new roster: ${json}`);
    res.end(json);
  }else {
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
