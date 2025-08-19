
import url from 'url';
import path from 'path'
import fs from 'fs'
import express from 'express'
import  cors from 'cors'

import AgeOfSigmar from './server/dist/src/AgeOfSigmar.js';
import Roster from './server/dist/src/Roster.js';
import RosterStateConverter from './server/dist/src/lib/RosterStateConverterImpl.js'
import { validateRoster } from './server/dist/src/lib/validation/RosterValidation.js'
import { nameRosterToRoster } from './server/dist/src/lib/NameRoster.js'

import installCatalog, { getCommitIdUsed } from './server/dist/src/lib/installCatalog.js'

import Search from './server/dist/src/search/Search.js'

const server = express();
const hostname = process.env.SCROLLCASTER_HOSTNAME || 'localhost';
const port = process.env.SCROLLCASTER_PORT || 3000;
const directoryPath = path.resolve("./data/age-of-sigmar-4th-main");
// const saveData = "./saveData.json";

var search = null;
var ageOfSigmar = null;
var version = (() => {
  const txt = fs.readFileSync('VERSION.txt');
  const verSplit = txt.toString().split('.');
  return {
    major: verSplit[0],
    minor: verSplit[1],
    patch: verSplit[2]
  }
})();

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

function getSearch(aos) {
  if (!search) {
    search = new Search(aos);
  }
  return search;
}

// Matches http(s)://scrollcaster.dev, http(s)://www.scrollcaster.io, etc.
const allowedOriginRegex = /^https?:\/\/(www\.)?scrollcaster\.(dev|io|app)$/;
const corsOptions = {
  origin: function (origin, callback) {
    if (hostname === 'localhost') {
      callback(null, true);
    } else if (!origin || origin.startsWith('http://127.0.0.1') || allowedOriginRegex.test(origin)) {
      callback(null, true);
    } else if (origin.includes('joe-deckers-projects.vercel.app')) {
      callback(null, true);
    } else {
      callback(`Not allowed by CORS: ${origin}`, false);
    }
  },
  methods: ['GET', 'POST'],
  credentials: false
};

server.use(cors(corsOptions));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

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

server.get('/search', async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let query = '';
  if (parsedUrl.query.query) {
    query = parsedUrl.query.query;
  }
  const aos = getAgeOfSigmar();
  const search = getSearch(aos);
  const result = search.search(query);
  res.end(JSON.stringify(result));
});

server.get('/armies', (req, res) => {
  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true); 
  if (parsedUrl.query.army) {
    const armyName = decodeURI(parsedUrl.query.army);
    const army = aos.getArmy(armyName);
    
    // don't stringify lut, because thats just everything...again
    res.end(JSON.stringify(army, (key, value) => {
      return key === 'lut' ? undefined : value;
    }));
    return;
  }

  const result = aos.getArmyAlliances();
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
    console.log(`Server Version: ${JSON.stringify(version)}`);
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

server.get('/lut', (req, res) => {
  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true);
  if (!parsedUrl.query.id || !parsedUrl.query.army) {
    res.status(400);
    res.end();
    return;
  }

  const id = parsedUrl.query.id;
  const armyValue = decodeURI(parsedUrl.query.army);
  const army = aos.getArmy(armyValue);
  const result = army.lut[id];
  if (result) {
    res.end(JSON.stringify(result));
    res.status(200);
    return;
  }
  res.status(404);
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

server.post('/import', (req, res) => {
  if (!req.body) {
      console.log ('PUT import error: body is undefined');
      res.status(400);
      res.end();
      return;
  }

  const aos = getAgeOfSigmar();
  const roster = nameRosterToRoster(aos, req.body);
  if (!roster) {
    res.status(400);
    res.end();
    return;
  }

  const rsc = new RosterStateConverter(aos);
  const state = rsc.serialize(roster);
  res.end(JSON.stringify(state));
  res.status(200);
  return;
});

server.post('/validate', async (req, res) => {
  if (!req.body) {
      console.log ('error: body is undefined');
      res.status(400);
      res.end();
      return;
  }

  const aos = getAgeOfSigmar();
  const rsc = new RosterStateConverter(aos);
  const roster = await rsc.deserialize(req.body, 'no-id');
  if (!roster) {
      res.status(400);
      res.end();
      return;
  }

  const army = aos.getArmy(roster.army);
  if (!army) {
      res.status(404);
      res.end();
      return;
  }

  const keywords = aos._getAvailableKeywords(army);
  let errs = validateRoster(army, roster, keywords);
  res.end(JSON.stringify(errs));
  res.status(200);
  return;
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
  const aos = getAgeOfSigmar();
  console.log(`Initializing search...`);
  getSearch(aos);
  console.log(`Scrollcaster server ${version.major}.${version.minor}.${version.patch} running at http://${hostname}:${port}/`);
}

server.listen(port, hostname, () => {
  start();
});
