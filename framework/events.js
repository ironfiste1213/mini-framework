import { DIFF_OPERATIONS } from './diff.js'

// assigns attributes or direct event handlers on a real dom element
export function assignAttribute(element, propName, value) {
  if (propName === 'key') return

  // handle event listeners onclick oninput directly bla addEventListener
  if (propName.startsWith('on')) {
    const eventType = propName.toLowerCase()
    element[eventType] = typeof value === 'function' ? value : null
    return
  }
  if (value === undefined || value === null) {
    removeAttribute(element, propName)
    return
  }
  if (propName === 'className') {
    element.setAttribute('class', value)
    return
  }

  // keep form inputs in sync
  if (propName === 'value' || propName === 'checked') {
    if (element[propName] !== value) {
      element[propName] = value
    }
    return
  }
  element.setAttribute(propName, value)
}
export function removeAttribute(element, propName) {
  if (propName.startsWith('on')) {
    element[propName.toLowerCase()] = null
  } else if (propName === 'className') {
    element.removeAttribute('class')
  } else if (propName === 'value' || propName === 'checked') {
    element[propName] = propName === 'checked' ? false : ''
  } else {
    element.removeAttribute(propName)
  }
}
// converts vnodes into actual real dom nodes recursively
export function buildRealDOM(vnode) {
  // text or number primitive nodes
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(String(vnode))
  }

  // empty node
  if (!vnode) {
    return document.createTextNode('')
  }

  // functional components execution
  if (typeof vnode.tag === 'function') {
    const componentVNode = vnode.tag(vnode.props)
    return buildRealDOM(componentVNode)
  }
  const domNode = document.createElement(vnode.tag)

  // assign properties and attach ref if present
  if (vnode.props) {
    if (vnode.props.ref && typeof vnode.props.ref === 'object') {
      vnode.props.ref.current = domNode
    }
    Object.entries(vnode.props).forEach(([key, val]) => {
      assignAttribute(domNode, key, val)
    })
  }

  // recursively append children
  if (vnode.children) {
    vnode.children.forEach(child => {
      domNode.appendChild(buildRealDOM(child))
    })
  }
  return domNode
}

// locate node in real dom using path key 0 1 2 etc
function locateNodeByPath(container, pathKey) {
  if (pathKey === '') return container.firstChild
  const indices = pathKey.split(',').map(Number)
  let current = container.firstChild

  for (const idx of indices) {
    if (!current) return null
    current = current.childNodes[idx]
  }
  return current
}

// helper to sort path keys
function comparePaths(pathA, pathB) {
  const partsA = pathA.split(',').filter(Boolean).map(Number)
  const partsB = pathB.split(',').filter(Boolean).map(Number)
  const minLen = Math.min(partsA.length, partsB.length)

  for (let i = 0; i < minLen; i++) {
    if (partsA[i] !== partsB[i]) return partsA[i] - partsB[i]
  }
  return partsA.length - partsB.length
}

// applies a diff operation to real dom
function applySingleOperation(container, pathKey, op) {
  switch (op.type) {
    case DIFF_OPERATIONS.ADD: {
      const createdNode = buildRealDOM(op.vnode)

      if (pathKey === '') {
        container.innerHTML = ''
        container.appendChild(createdNode)
        break
      }

      const indices = pathKey.split(',')
      const childIndex = Number(indices.pop())
      const parentPath = indices.join(',')
      const parentEl = parentPath === '' ? container.firstChild : locateNodeByPath(container, parentPath)

      if (!parentEl) break
      const refNode = parentEl.childNodes[childIndex] || null
      parentEl.insertBefore(createdNode, refNode)
      break
    }
    case DIFF_OPERATIONS.REMOVE: {
      const targetNode = pathKey === '' ? container.firstChild : locateNodeByPath(container, pathKey)
      if (targetNode && targetNode.parentNode) {
        targetNode.parentNode.removeChild(targetNode)
      }
      break
    }
    case DIFF_OPERATIONS.REPLACE: {
      const targetNode = pathKey === '' ? container.firstChild : locateNodeByPath(container, pathKey)
      if (!targetNode) break
      const replacement = buildRealDOM(op.vnode)
      if (targetNode.parentNode) {
        targetNode.parentNode.replaceChild(replacement, targetNode)
      }
      break
    }
    case DIFF_OPERATIONS.UPDATE_ATTRIBUTES: {
      const targetNode = pathKey === '' ? container.firstChild : locateNodeByPath(container, pathKey)
      if (targetNode) {
        assignAttribute(targetNode, op.key, op.value)
      }
      break
    }
    case DIFF_OPERATIONS.REMOVE_ATTRIBUTE: {
      const targetNode = pathKey === '' ? container.firstChild : locateNodeByPath(container, pathKey)
      if (targetNode) {
        removeAttribute(targetNode, op.key)
      }
      break
    }
    case DIFF_OPERATIONS.UPDATE_TEXT: {
      const targetNode = pathKey === '' ? container.firstChild : locateNodeByPath(container, pathKey)
      if (targetNode) {
        targetNode.textContent = op.text
      }
      break
    }
  }
}

// main export to apply all patches calculated from diffMap to dom (lessgooo)
export function applyDOMPatches(rootContainer, patchMap) {
  if (!rootContainer) return

  const removals = []
  const additionsAndUpdates = []
  patchMap.forEach((ops, path) => {
    ops.forEach(op => {
      if (op.type === DIFF_OPERATIONS.REMOVE) {
        removals.push({ path, op })
      } else {
        additionsAndUpdates.push({ path, op })
      }
    })
  })
  const sortPathAsc = (a, b) => comparePaths(a.path, b.path)
  const sortPathDesc = (a, b) => comparePaths(b.path, a.path)

  // apply additions and attribute updates top down
  additionsAndUpdates.sort(sortPathAsc)
  additionsAndUpdates.forEach(({ path, op }) => applySingleOperation(rootContainer, path, op))
  // apply removals bottom up so path indices stay valid
  removals.sort(sortPathDesc)
  removals.forEach(({ path, op }) => applySingleOperation(rootContainer, path, op))
}
