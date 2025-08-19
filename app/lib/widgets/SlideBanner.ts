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

    const hdr = document.querySelector('header') as HTMLElement;
    const start = hdr.offsetHeight - 60;
    div.animate([
        { top: `${start}px` },           // 0%
        { top: `${hdr.offsetHeight}px`, offset: 0.03 }, // 10%
        { top: `${hdr.offsetHeight}px`, offset: 0.97 }, // 70%
        { top: `${start}px` }            // 100%
    ], {
        duration: 2500,           // Total duration in milliseconds
        easing: 'ease-in-out',    // Optional: smooth transition
        fill: 'forwards'          // Keeps final state after animation
    });
}