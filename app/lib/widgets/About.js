const About = {
    license: () => {
        return `
            <div class='license'>
This file is part of Scrollcaster.
<br/><br/>
Copyright (C) 2025 Joseph Decker
<br/>
<br/>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
<br/>
<br/>
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
<br/>
<br/>
You should have received a copy of the GNU General Public License along with this program.
If not, see <a href=https://www.gnu.org/licenses/>https://www.gnu.org/licenses/</a>.
            </div>
        `;
    },
    attribution: ()=> {
        return `
        <div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/roundicons" title="Roundicons">Roundicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">Pixel perfect</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/mayor-icons" title="Mayor Icons">Mayor Icons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/slidicon" title="Slidicon">Slidicon</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/syahrul-hidayatullah" title="Syahrul Hidayatullah">Syahrul Hidayatullah</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/meaicon" title="meaicon">meaicon</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
        `;
    },
    async get() {
        const clientVersion = await version.getClientVersion();
        const serverVersion = await version.getServerVersion();
        const bsdataRevision = await version.getBsDataVersion();
        const bpVersion = await version.getBattleProfileVersion();
        const content = document.createElement('p');
        content.innerHTML = `
            <h3 style='width: fit-content' class='section-title'>About</h3>
            <div class='section' style='padding: 1em; background-color: ${getVar('hover-color')}; border: 2px solid ${getVar('background-color')}'>
            
            <h3 style='padding: 0; margin-top: 0;'>Version</h3>
            <b>• Client Version:</b> ${clientVersion} <br/>
            <b>• Server Version:</b> ${serverVersion} <br/>
            <b>• Battle Profile Version:</b> ${bpVersion} <br/>
            <b>• BSData Commit:</b> ${bsdataRevision} <br/>
            <br/>

            <h3 style='padding: 0; margin-top: 0;'>Contribute: </h3>
            <a style='color: ${getVar('blue-color')};' 
            target='_blank' href='https://github.com/blackeclipsevii/scrollcaster'>
            Contribute to Scrollcaster
            </a>
            <br/>
            <a style='color: ${getVar('blue-color')};' 
            target='_blank' href='https://github.com/blackeclipsevii/scrollcaster-android'>
            Contribute to Scrollcaster (Android)
            </a>
            <br/>
            <a style='color: ${getVar('blue-color')};' 
            target='_blank' href='https://github.com/BSData/age-of-sigmar-4th'>
            Contribute to BSData
            </a>
            <br/>
            <br/>
            <div style='display: flex; justify-content: left; align-content: center;'>
            <div class='kofi-div-nested'>
                <a target="_blank" href="https://ko-fi.com/scrollcaster">
                <img src="resources/support_me_on_kofi_beige.webp"></img>
                </a>
            </div>
            </div>
            <h3 style='padding-top: 0; margin: 0;'> License (GPL v3): </h3> <br/>
            ${this.license()}
            <br/>
            <h3 style='padding: 0; margin-top: 0;'> Attribution: </h3>
            <div class='attribution'>
            ${this.attribution()}
            </div>
        </div>
        `;
        
        content.style.fontSize = '14px';
        return content;
    }
}