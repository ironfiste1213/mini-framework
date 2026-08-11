// assigns attributes or direct event handlers on a real dom element
export function assignAttribute(element, propName, value) {
  if (propName === 'key') return

  // handle event listeners onclick oninput directly bla addEventListener
  if (propName.startsWith('on')) {
    const eventType = propName.toLowerCase()
    element[eventType] = typeof value === 'function' ? value : null
    return
  }
  if (value === undefined) {
    element.removeAttribute(propName)
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
