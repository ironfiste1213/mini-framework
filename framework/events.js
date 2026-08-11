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
