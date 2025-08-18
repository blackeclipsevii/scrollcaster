# Scrollcaster

A streamlined, mobile-first army builder for Age of Sigmar 4, designed to help players create battle-ready lists with speed and ease.

**Features:**
- Quick, intuitive, and easy to navigate interface
- Up-to-date rules using the lastest BsData: https://github.com/BSData/age-of-sigmar-4th
- Import army lists from other list-builders and websites

![import-roster](https://github.com/user-attachments/assets/ef75e472-d3a8-4a58-aa9e-ff4f68a4595c)

## Using Scrollcaster

**Browser:** https://scrollcaster.app

**Android App:** https://play.google.com/store/apps/details?id=com.scrollcaster

## Contribution

**Android App (Github):** https://github.com/blackeclipsevii/scrollcaster-android

### Client

User interface with minor logical elements.

Node.js for the build system.

#### Building

Both the client must be built.

```
// navigate to ./app
cd app

// install the dependencies
npm install

// build just the typescript files for development
npm run buildts

// OR build the release app (runs buildts and package)
npm run build
```

#### Development UI

The current desktop app (desktop-ui) is just a tauri example resized to the dimentions of a phone.
It will automatically refresh when the content of the app changes, and doesn't cache as heavily as a standard browser.

*This is not a released product.*


### Server (Node.js)

Interfaces with BSData and performs more complex validation.

#### Building

The server uses typescript and must be built prior to running.

```
// install the dependencies
npm install

// build and run the server
npm run server
```
