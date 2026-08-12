const stateSlots = [];

let stateIndex = 0;
let requestRender = null;
let renderScheduled = false;


export function setRenderCallback(callback) {

  if (typeof callback !== 'function') {
    throw new Error('expects function');
  }

  requestRender = callback;

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

      setValue: null
       
    };
    
    slot.setValue = nextValue => {
      
      const resolvedValue =
      
      typeof nextValue === 'function' ? nextValue(slot.value) : nextValue; 
      
      // unnecessary render
      if (Object.is(slot.value, resolvedValue)) return;

      slot.value = resolvedValue;

      scheduleRender();

    };

    stateSlots[currentIndex] = slot;

  }

  const slot = stateSlots[currentIndex];


  return [slot.value, slot.setValue];

}


export function useEffect(callback, dependencies) {
  
  const currentIdx = effectIdx;

  const previousDeps = effectDepsStore[currentIdx];

  let needsExecution = false;

  (dependencies === undefined || previousDeps === undefined || dependencies.length !== previousDeps.length) ? 

  needsExecution = true : needsExecution = dependencies.some((dep, i) => !Object.is(dep, previousDeps[i])); 
  
  // cleanup useffect (we add a cleanup func to the effect "example remove  old listners")

  if (needsExecution) {

    effectQueue.push(() => {
      
      (typeof effectCleanupStore[currentIdx] === 'function') ? effectCleanupStore[currentIdx]() : null ; 

      const cleanup = callback();

      effectCleanupStore[currentIdx] = cleanup;

    });

  }

  effectDepsStore[currentIdx] = dependencies;

  effectIdx++;

}


export function useRef(initialValue) {

  const currentIdx = refIdx;


(refStore[currentIdx] === undefined) ? refStore[currentIdx] = { current: initialValue } : null ; 

    refIdx++;

  return refStore[currentIdx];

}

export function executeEffects() {

  const queueToRun = [...effectQueue];

  effectQueue.length = 0;

  queueToRun.forEach(fn => fn());
  
}