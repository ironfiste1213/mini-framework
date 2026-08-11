// diff action types
export const DIFF_OPERATIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  REPLACE: 'REPLACE',
  UPDATE_ATTRIBUTES: 'UPDATE_ATTRIBUTES',
  UPDATE_TEXT: 'UPDATE_TEXT'
}

// cancompariw old and new props to find attributes lli tbdlou
export function diffAttributes(oldProps = {}, newProps = {}) {
  const changes = []
  // merge keys from both prop objects to catch added wella removed wella changed props
  const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)])

  keys.forEach(attrName => {
    const prevVal = oldProps[attrName]
    const nextVal = newProps[attrName]

    // hna we need to always push updates for value and checked to keep controlled form elements in sync
    if (prevVal !== nextVal || attrName === 'value' || attrName === 'checked') {
      changes.push({
        type: DIFF_OPERATIONS.UPDATE_ATTRIBUTES,
        key: attrName,
        value: nextVal
      })
    }
  })
  return changes
}

// core function to calculate diffs between old and new vnodes
export function calculateDiff(oldNode, newNode, pathKey = '') {
  const diffMap = new Map()
  const isOldEmpty = oldNode === null || oldNode === undefined
  const isNewEmpty = newNode === null || newNode === undefined

  if (isOldEmpty && isNewEmpty) return diffMap

  // node added
  if (isOldEmpty && !isNewEmpty) {
    diffMap.set(pathKey, [{ type: DIFF_OPERATIONS.ADD, vnode: newNode }])
    return diffMap
  }

  // removed
  if (!isOldEmpty && isNewEmpty) {
    diffMap.set(pathKey, [{ type: DIFF_OPERATIONS.REMOVE, vnode: oldNode }])
    return diffMap
  }

  const isOldPrimitive = typeof oldNode === 'string' || typeof oldNode === 'number'
  const isNewPrimitive = typeof newNode === 'string' || typeof newNode === 'number'

  // both are plain text wella numbers compare string
  if (isOldPrimitive && isNewPrimitive) {
    if (String(oldNode) !== String(newNode)) {
      diffMap.set(pathKey, [{ type: DIFF_OPERATIONS.UPDATE_TEXT, text: String(newNode) }])
    }
    return diffMap
  }
  // string vs vnode replace entirely
  if (isOldPrimitive !== isNewPrimitive) {
    diffMap.set(pathKey, [{ type: DIFF_OPERATIONS.REPLACE, vnode: newNode }])
    return diffMap
  }
  // tag wella key tbdlou replace the whole node
  if (oldNode.props?.key !== newNode.props?.key || oldNode.tag !== newNode.tag) {
    diffMap.set(pathKey, [{ type: DIFF_OPERATIONS.REPLACE, vnode: newNode }])
    return diffMap
  }

  const attrPatches = diffAttributes(oldNode.props || {}, newNode.props || {})
  if (attrPatches.length > 0) {
    diffMap.set(pathKey, attrPatches)
  }

  const oldChildren = oldNode.children || []
  const newChildren = newNode.children || []
  const totalLength = Math.max(oldChildren.length, newChildren.length)

  // loop through children and recurse to collect diffs
  for (let i = 0; i < totalLength; i++) {
    const childPath = pathKey === '' ? `${i}` : `${pathKey},${i}`
    const childDiffs = calculateDiff(oldChildren[i], newChildren[i], childPath)

    childDiffs.forEach((changes, key) => {
      const existing = diffMap.get(key) || []
      diffMap.set(key, [...existing, ...changes])
    })
  }

  return diffMap
}
