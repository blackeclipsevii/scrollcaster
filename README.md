# Scrollcaster

A streamlined, mobile-first army builder for Age of Sigmar 4, designed to help players create battle-ready lists with speed and ease.
Scrollcaster leverages BSData: https://github.com/BSData/age-of-sigmar-4th

### Import army lists from other list-builders and websites

![import-roster-example](https://github.com/user-attachments/assets/7ad1889d-d447-41b5-b1e2-983ee95a5741)

### List validation

<img width="452" height="799" alt="image" src="https://github.com/user-attachments/assets/13f37915-4f05-4ba3-8e92-38c723a61ced" />

### Searchable catalog

![search](https://github.com/user-attachments/assets/294ac1b3-13d0-4917-8b61-4893c53d134c)

### Intelligent weapon selection with optional tuning for precision control.

![weapon-selection](https://github.com/user-attachments/assets/122ad631-8998-447a-82e8-f8f80fa596df)

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
