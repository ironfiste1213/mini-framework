const stateSlots = [];
const effectDepsStore = [];
const effectCleanupStore = [];
const effectQueue = [];
let effectIdx = 0;
let stateIndex = 0;
let requestRender = null;
let renderScheduled = false;


export function setRenderCallback(callback) {
  if (typeof callback !== 'function') {
    throw new Error('expects function');
  }
  requestRender = callback;
}

export function resetHookIndices() {
  stateIndex = 0;
  effectIdx = 0;
}
// before it calls the root component again.
export function resetStateIndex() { stateIndex = 0; }
  
function scheduleRender() {
  // duplicate scheduling prev
  if (!requestRender || renderScheduled) return;
  renderScheduled = true;
  // browser queue
  queueMicrotask(() => {
    renderScheduled = false;
    requestRender();
  });
  
}

export function useState(initialValue) {
  const currentIndex = stateIndex++;
  
  if (!(currentIndex in stateSlots)) {
    const slot = {
      value: typeof initialValue === 'function' ? initialValue() : initialValue,
      queue: [],
      setValue: null
    };

    slot.setValue = nextValue => {
      slot.queue.push(nextValue)
      scheduleRender()
    }

    stateSlots[currentIndex] = slot;

  }

  const slot = stateSlots[currentIndex];

  while (slot.queue.length > 0) {
    const action = slot.queue.shift()
    const resolvedValue = typeof action === 'function' ? action(slot.value) : action
    if (!Object.is(slot.value, resolvedValue)) {
      slot.value = resolvedValue
    }
  }
  return [slot.value, slot.setValue];

}


export function useEffect(callback, dependencies) {
  
  const currentIdx = effectIdx;

  const previousDeps = effectDepsStore[currentIdx];

  let needsExecution = false;
if (dependencies === undefined || previousDeps === undefined || dependencies.length !== previousDeps.length) {
  needsExecution = true;
} else {
  needsExecution = dependencies.some((dep, i) => !Object.is(dep, previousDeps[i]));
}
  // cleanup useffect (we add a cleanup func to the effect "example remove  old listners")

  if (needsExecution) {
    const previousCleanup = effectCleanupStore[currentIdx]
    effectQueue.push(() => {
      
   if (typeof previousCleanup === 'function') {
      previousCleanup()
    }
      const cleanup = callback();

     effectCleanupStore[currentIdx] = typeof cleanup === 'function' ? cleanup : null
    });

  }

  effectDepsStore[currentIdx] = dependencies;

  effectIdx++;

}
export function flushEffects() {
  while (effectQueue.length > 0) {
    const effect = effectQueue.shift()
    effect()
  }
}
