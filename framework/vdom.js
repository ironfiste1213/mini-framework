const FILTERED_VALUES = [null, undefined, false, true];

export function createElement(tag, props, ...children) {
  const normalizedProps = props || {};
  const flattenedChildren = normalizeChildren(children);

  return {
    tag,
    props: normalizedProps,
    children: flattenedChildren
  };
}

function normalizeChildren(childrenList) {
  const result = [];

  for (const child of childrenList) {
    if (FILTERED_VALUES.includes(child)) {
      continue;
    }

    if (Array.isArray(child)) {
      result.push(...normalizeChildren(child));
    } else {
      result.push(child);
    }
  }

  return result;
}
