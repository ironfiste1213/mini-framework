let prevVNode = null;
let rootElement = null;
let rootComponent = null;

import { resetHookIndex, executeEffects } from './hooks.js';
import { calculateDiff } from './diff.js';
import { applyDOMPatches } from './events.js';

export function setRootVDOM(vnode) { prevVNode = vnode; } 
  


export function getRootVDOM() { return prevVNode ; } 
  


export function mount(component, container) {

  rootComponent = component;

  rootElement = typeof container === 'string' ? document.querySelector(container) : container;
  
  if (!rootElement) return;

  renderApp();

}

export function renderApp() {

  if (!rootComponent || !rootElement) return;

  resetHookIndex();

  const nextVDOM = rootComponent();
  
  const currentVDOM = getRootVDOM();

  const patchSet = calculateDiff(currentVDOM, nextVDOM);

  applyDOMPatches(rootElement, patchSet);

  setRootVDOM(nextVDOM);

  setTimeout(executeEffects, 0);

}
