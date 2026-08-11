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
