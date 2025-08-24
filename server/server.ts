
import url from 'url';
import path from 'path'
import fs from 'fs'
import express from 'express'
import cors from 'cors'

import AgeOfSigmar from './src/AgeOfSigmar.js';
import Roster from './src/Roster.js';
import RosterStateConverter from './src/lib/RosterStateConverterImpl.js'
import { validateRoster } from './src/lib/validation/RosterValidation.js'
import { nameRosterToRoster } from './src/lib/NameRoster.js'

import installCatalog from './src/lib/installCatalog.js'

import Search from './src/search/Search.js'

import UnitInterf from '@scrollcaster/shared-lib/UnitInterface.js';

// don't allow requests while the server is starting
// it can really muck things up unexpectedly
var serverStarted = false;
var commitIdUsed: string | null = null;

const server = express();
const hostname = process.env.SCROLLCASTER_HOSTNAME || 'localhost';
const port = process.env.SCROLLCASTER_PORT || 3000;
let directoryPath = '';

var search: Search | null = null;
var ageOfSigmar: AgeOfSigmar | null = null;
var version = (() => {
  const txt = fs.readFileSync('VERSION.txt');
  const verSplit = txt.toString().split('.');
  return {
    major: verSplit[0],
    minor: verSplit[1],
    patch: verSplit[2]
  }
})();

function getAgeOfSigmar(): AgeOfSigmar {
  if (!ageOfSigmar) {
    ageOfSigmar = new AgeOfSigmar(directoryPath);
  }
  return ageOfSigmar;
}

function getSearch(aos: AgeOfSigmar): Search {
  if (!search) {
    search = new Search(aos);
  }
  return search;
}

// Matches http(s)://scrollcaster.dev, http(s)://www.scrollcaster.io, etc.
const allowedOriginRegex = /^https?:\/\/(www\.)?scrollcaster\.(dev|io|app)$/;
const corsOptions = {
  origin: function (origin: string, callback: (a: string | null, b: boolean)=>void) {
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
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

  const aos = getAgeOfSigmar();
  res.end(JSON.stringify(aos.battleTacticCards));
  res.status(200);
});

server.get('/lores', (_, res) => {
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

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
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  let query = '';
  if (parsedUrl.query.query) {
    query = parsedUrl.query.query as string;
  }
  const aos = getAgeOfSigmar();
  const search = getSearch(aos);
  const result = search.search(query);
  res.end(JSON.stringify(result));
});

server.get('/armies', (req, res) => {
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true); 
  if (parsedUrl.query.army) {
    const armyName = parsedUrl.query.army.toString();
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

server.get('/version', (req, res) => {
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.query.of) {
    const of: string = parsedUrl.toString();
    if (of.toLowerCase() === 'bsdata') {
      console.log (`BSData Commit Used: ${commitIdUsed}`);
      res.end(JSON.stringify({version: commitIdUsed}));
      return;
    }

    if (of.toLowerCase() === 'battle profiles') {
      const filename = './resources/battle profiles/version.txt';
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
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }
  
  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true);
  if (!parsedUrl.query.armyName) {
    res.status(400);
    res.end();
    return;
  }

  const armyName = parsedUrl.query.armyName.toString();
  const army = aos.getArmy(armyName);
  if (!army) {
    res.status(404);
    res.end();
    return;
  }

  res.end(JSON.stringify(army.upgrades));
  res.status(200);
});

server.get('/lut', (req, res) => {
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true);
  if (!parsedUrl.query.id || !parsedUrl.query.army) {
    res.status(400);
    res.end();
    return;
  }

  const id = parsedUrl.query.id.toString();
  const armyValue = parsedUrl.query.army.toString();
  const army = aos.getArmy(armyValue);
  if (!army) {
    res.status(404);
    res.end();
    return;
  }

  const result = army.lut[id];
  if (result) {
    res.end(JSON.stringify(result));
    res.status(200);
    return;
  }
  
  res.status(404);
});

server.get('/regimentsOfRenown', (req, res) =>{
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true); // 'true' parses the query string
  if (parsedUrl.query.army) {
    const armyValue = parsedUrl.query.army.toString();
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
    const id = parsedUrl.query.id.toString();
    const regiment = aos.regimentsOfRenown[id];
    if (!regiment) {
      res.status(404);
      res.end();
      return;
    }
    
    res.end(JSON.stringify(regiment));
    res.status(200);
    return;
  }

  // i would really prefer the lookup table but the 'army' side of the api returns a list
  res.end(JSON.stringify(Object.values(aos.regimentsOfRenown)));
  res.status(200);
  return;
});

server.post('/import', (req, res) => {
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

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
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

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
  let errs = validateRoster(army, roster as Roster, keywords);
  res.end(JSON.stringify(errs));
  res.status(200);
  return;
})

server.get('/units', (req, res) => {
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true); // 'true' parses the query string
  let units: {[name: string]: UnitInterf} | undefined;
  if (parsedUrl.query.army) {
    const armyValue = parsedUrl.query.army.toString();
    console.log(`Army requested: ${armyValue}`);

    const army = aos.getArmy(armyValue);
    if (!army) {
      res.status(404);
      res.end();
      return;
    }
    
    if (parsedUrl.query.leaderId) {
      const leaderId = parsedUrl.query.leaderId.toString();
      const unitsArr: UnitInterf[] | undefined = aos.getRegimentOptions(army, leaderId);
      if (!unitsArr) {
        res.status(404);
        res.end();
        return;
      }

      res.end(JSON.stringify(units));
      return;
    }

    units = army.units;
  } else {
    units = aos.units;
  }
  
  if (parsedUrl.query.name) {
    const unitName = parsedUrl.query.name.toString();
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
    const id = parsedUrl.query.id.toString();
    console.log(`Unit requested: ${id}`);
    const unit = units[id];
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
  if (!serverStarted) {
    res.status(503);
    res.end();
    return;
  }

  const aos = getAgeOfSigmar();
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.query.army) {
    const armyValue = parsedUrl.query.army.toString();
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


function getFirstFolderPath(dirPath: string) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const firstFolder = entries.find(entry => entry.isDirectory());
    return firstFolder ? path.join(dirPath, firstFolder.name) : null;
  } catch (err) {
    console.error('Error reading directory:', err);
    return null;
  }
}

async function start() {
  console.time('Total Startup Time')
  console.log(`Downloading catalog...`);

  // to-do have this setting configurable
  const tag = process.env.SCROLLCASTER_BSDATA_TAG;
  const commitId = process.env.SCROLLCASTER_BSDATA_COMMIT;
  commitIdUsed = await installCatalog(tag, commitId);
  const dirPath = getFirstFolderPath('data');
  if (!dirPath) {
    throw new Error(`Somehow, ${dirPath} was not found.`);
  }
  
  directoryPath = dirPath;

  console.log(`Loading libraries...`);
  console.time('Load AOS Time')
  const aos = getAgeOfSigmar();
  console.timeEnd('Load AOS Time')
  
  console.time('Load Armies Time')
  await aos.loadAllArmies();
  console.timeEnd('Load Armies Time')
  
  console.time('Initialize Search Time')
  console.log(`Initializing search...`);
  getSearch(aos);
  console.timeEnd('Initialize Search Time')
  
  console.log(`Scrollcaster server ${version.major}.${version.minor}.${version.patch} running at http://${hostname}:${port}/`);
  serverStarted = true;
  console.timeEnd('Total Startup Time')
}

server.listen(Number(port), hostname, () => {
  start();
});
