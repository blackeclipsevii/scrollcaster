
import url from 'url';
import path from 'path'
import fs from 'fs'
import express from 'express'

import AgeOfSigmar from './server/dist/AgeOfSigmar.js';
import Roster from './server/dist/Roster.js';

import installCatalog, { getCommitIdUsed } from './server/dist/lib/installCatalog.js'

const server = express();
const hostname = process.env.SCROLLCASTER_HOSTNAME || 'localhost';
const port = process.env.SCROLLCASTER_PORT || 3000;
const directoryPath = path.resolve("./data/age-of-sigmar-4th-main");
// const saveData = "./saveData.json";

var ageOfSigmar = null;
var version = {
  major: 1,
  minor: 3,
  patch: 2
};

/*
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
*/
function getAgeOfSigmar() {
  if (!ageOfSigmar) {
    ageOfSigmar = new AgeOfSigmar(directoryPath);
  }
  return ageOfSigmar;
}

server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
server.use(express.json());

server.get('/tactics', (req, res) => {
  const aos = getAgeOfSigmar();
  res.end(JSON.stringify(aos.battleTacticCards));
  res.status(200);
});

server.get('/lores', (_, res) => {
  const aos = getAgeOfSigmar();
  const lores = aos.lores;
  const foo = {
    lores: lores.lores,
    universal: lores.universal
  }
  res.end(JSON.stringify(foo));
  res.status(200);
});

server.get('/armies', (req, res) => {
  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true); 
  if (parsedUrl.query.army) {
    const armyName = decodeURI(parsedUrl.query.army);
    const army = aos.getArmy(armyName);
    res.end(JSON.stringify(army));
    return;
  }

  const result = aos.getArmyNames();
  res.end(JSON.stringify(result));
});

server.get('/libraries', (req, res) => {
  const aos = getAgeOfSigmar();
  const result = aos.getLibraryNames();
  res.end(JSON.stringify(result));
});

server.get('/version', (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.query.of) {
    if (parsedUrl.query.of.toLowerCase() === 'bsdata') {
      const commit = getCommitIdUsed();
      console.log (`BSData Commit Used: ${commit}`);
      res.end(JSON.stringify({version: commit}));
      return;
    }

    if (parsedUrl.query.of.toLowerCase() === 'battle profiles') {
      const filename = './server/resources/battle profiles/version.txt';
      if (!fs.existsSync(filename)) {
        res.status(404);
        res.end();
      }
      const bpVers = fs.readFileSync(filename);
      console.log (`Battle Profile release date: ${bpVers}`);
      res.end(JSON.stringify({version: `${bpVers}`}));
      return
    }
  } else {
    res.end(JSON.stringify(version));
  }

  res.status(400);
  res.end();
});

server.get('/upgrades', (req, res) => {
  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true);
  const armyValue = decodeURI(parsedUrl.query.army);
  const army = aos.getArmy(armyValue);
  res.end(JSON.stringify(army.upgrades));
  res.status(200);
});

server.get('/regimentsOfRenown', (req, res) =>{
  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true); // 'true' parses the query string
  if (parsedUrl.query.army) {
    const armyValue = decodeURI(parsedUrl.query.army);
    console.log(`Army requested: ${armyValue}`);

    const army = aos.getArmy(armyValue);
    if (!army) {
      res.status(404);
      res.end();
      return;
    }

    res.end(JSON.stringify(army.regimentsOfRenown));
    res.status(200);
    return;
  }

  if (parsedUrl.query.id) {
    const regiment = aos.regimentsOfRenown[parsedUrl.query.id];
    if (!regiment) {
      res.status(404);
      res.end();
      return;
    }
    
    res.end(JSON.stringify(regiment));
    res.status(200);
    return;
  }

  res.end(JSON.stringify(aos.regimentsOfRenown));
  res.status(200);
  return;
});

server.get('/validate', (req, res) => {
  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.query.leader && parsedUrl.query.army) {
    const regiment = [decodeURI(parsedUrl.query.leader)];
    for (let i = 0; i < 10; ++i) {
      const arg = `unit${i}`;
      if (!(parsedUrl.query[arg]))
        break;
      regiment.push(decodeURI(parsedUrl.query[arg]));
    }
    
    const armyName = decodeURI(parsedUrl.query.army);
    const army = aos.getArmy(armyName);
    if (!army) {
      res.status(404);
      res.end();
      return;
    }

    const errors = aos.validateRegiment(army, regiment);
    res.end(JSON.stringify(errors));
    res.status(200);
    return;
  }

  res.status(400);
  res.end();
})

server.get('/units', (req, res) => {
  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true); // 'true' parses the query string
  let units = null;
  if (parsedUrl.query.army) {
    const armyValue = decodeURI(parsedUrl.query.army);
    console.log(`Army requested: ${armyValue}`);

    const army = aos.getArmy(armyValue);
    if (!army) {
      res.status(404);
      res.end();
      return;
    }
    
    if (parsedUrl.query.leaderId) {
      units = aos.getRegimentOptions(army, parsedUrl.query.leaderId);
      res.end(JSON.stringify(units));
      return;
    }

    units = army.units;
  } else {
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
  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.query.army) {
    const armyValue = decodeURI(parsedUrl.query.army);
    console.log(`army value: ${armyValue}`)
    const army = aos.getArmy(armyValue);
    if (!army) {
      res.status(404);
      res.end();
      return;
    }
    const roster = new Roster(army);
    const json = JSON.stringify(roster);
    res.end(json);
    res.status(200);
    return;
  }

  res.end();
  res.status(404);
});

/*
server.get('/roster', (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const userId = parsedUrl.query.uuid;
  const user = rosters[userId];

  if (parsedUrl.query.id) {
    if (!user) {
      res.status(404);
      res.end();
      return;
    }

    const id = decodeURI(parsedUrl.query.id);
    const roster = user[id];
    if (!roster) {
      res.status(404);
      res.end();
      return;
    }

    const json = JSON.stringify(roster);
    console.log(`GET roster: ${roster.id}`);
    res.end(json);
    return;
  } 
  
  if (parsedUrl.query.army) {
    const armyValue = decodeURI(parsedUrl.query.army);
    console.log(`army value: ${armyValue}`)
    const army = getArmy(armyValue);
    if (!army) {
      res.status(404);
      res.end();
      return;
    }
    const roster = new Roster(army);
    const json = JSON.stringify(roster);
    console.log(`GET new roster: ${json}`);
    res.end(json);
    return;
  }

  if (!user) {
    res.status(404);
    res.end();
    return;
  }
  const names = Object.getOwnPropertyNames(user);
  let result = [];
  for (let i = 0; i < names.length; ++i) {
    if (user[names[i]].hidden)
      continue;
    result.push(names[i]);
  }
  const json = JSON.stringify(result);
  console.log('GET roster list: ' + json);
  res.end(json);
  res.status(200);
});

server.post('/roster', (req, res) => {
  console.log("POST roster")
  const parsedUrl = url.parse(req.url, true);
  const userId = parsedUrl.query.uuid;
  const user = rosters[userId];
  if (!user) {
    // should be a put
    res.status(404);
    res.end();
    return;
  }

  let current = user[req.body.id];
  let updated = req.body;
  if (current) {
    let names = Object.getOwnPropertyNames(req.body);
    for (let i = 0; i < names.length; ++i) {
      current[names[i]] = updated[names[i]];
    }
    user[req.body.id] = current;
  } else {
    user[req.body.id] = req.body;
  }
  res.status(200);
  res.end();
  saveRosters();
});

server.put('/roster', (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  console.log(`PUT roster ${parsedUrl.query.uuid} ${req.body.id}`)
  const userId = parsedUrl.query.uuid;
  const userStorage = rosters[userId];
  if (!userStorage) {
    rosters[userId] = {};
  }
  rosters[userId][req.body.id] = req.body;
  res.end();
  saveRosters();
});

server.delete('/roster', (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const userId = parsedUrl.query.uuid;
  const id = parsedUrl.query.id;
  console.log(`DELETE roster ${userId} ${id}`)
  const user = rosters[userId];
  if (user) {
    delete user[id];
  }
  res.end();
  saveRosters();
  return res.status(200);
});
*/

async function start() {
  console.log(`Downloading catalog...`);
  await installCatalog();
  console.log(`Loading libraries...`);
  await getAgeOfSigmar();
  console.log(`Server running at http://${hostname}:${port}/`);
}

server.listen(port, hostname, () => {
  start();
});
