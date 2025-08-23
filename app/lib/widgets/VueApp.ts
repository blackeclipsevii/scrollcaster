import { App, Component, createApp } from "vue";

let _appInstance: App<Element> | null = null;

export function showVueComponent(vueComponent: Component, rootProps?: {[x: string]: unknown} | null, displayOnMe?: HTMLElement) {
  if (!_appInstance) {
    const visibleContent = displayOnMe ? displayOnMe : document.getElementById('visible-content') as HTMLElement;
    visibleContent.innerHTML = '';
    _appInstance = createApp(vueComponent, rootProps)
    _appInstance.mount(visibleContent)
  }
}

export function vueIsShowing() {
    return _appInstance !== null;
}

export function hideVueComponent() {
  if (_appInstance) {
    _appInstance.unmount();
    _appInstance = null
  }
}
