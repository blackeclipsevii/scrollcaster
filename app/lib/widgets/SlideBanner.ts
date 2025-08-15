import { getVar } from "../functions/getVar.js";

export enum SlideBannerMessageType {
    Bad = 0,
    Good = 1,
    Neutral = 2
}

export const displaySlidebanner = (message: string, type: SlideBannerMessageType) => {
    let div = document.querySelector('.slide-banner') as HTMLDivElement | null;
    if (!div) {
        div = document.createElement('div');
        div.className = 'slide-banner';
        const persist = document.querySelector('.persist') as HTMLDivElement;
        persist.append(div);
    }

    div.innerHTML = message;
    if (type === SlideBannerMessageType.Bad) {
        div.style.backgroundColor = getVar('red-color');
    } else if (type === SlideBannerMessageType.Good) {
        div.style.backgroundColor = getVar('green-color');
    } else {
        div.style.backgroundColor = getVar('blue-color');
    }

    div.onclick = () => div.classList.remove('active');

    div.classList.add('active');
    setTimeout(() => {
        div.classList.remove('active');
    }, 2200); // 0.2s slide
}