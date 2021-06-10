import { ContentRule, IndexedRecord } from './types';

function innerText(elm: Element) {
  const clone = elm.cloneNode(true) as Element;
  clone.querySelectorAll('script,style').forEach((tag) => tag.remove());
  return clone.textContent;
}

function walk(elm: Element, visitor: (elm: Element) => boolean) {
  const walkChildren = visitor(elm);
  if (walkChildren) {
    for (const child of elm.children) {
      walk(child, visitor);
    }
  }
}

function getLevel(elm: Element, selectors: ContentRule): number | null {
  const level = selectors.hierarchy.findIndex(({ selector }) =>
    elm.matches(selector)
  );
  return level < 0 ? null : level;
}

function getOwnAnchor(elm: Element) {
  return elm.id || elm.getAttribute('name');
}

function getAnchor(elm: Element) {
  const ownAnchor = getOwnAnchor(elm);
  if (ownAnchor) {
    return ownAnchor;
  }
  const childWithAnchor = elm.querySelector('[id], [name]');
  return childWithAnchor ? getOwnAnchor(childWithAnchor) : null;
}

export default function extractRecords(
  root: HTMLElement,
  selectors: ContentRule
): IndexedRecord[] {
  const result: IndexedRecord[] = [];
  let currentLevel: number | null = null;

  let current: IndexedRecord = {
    hierarchy: selectors.hierarchy.map(() => null),
    anchor: null,
    text: '',
  };

  walk(root, (elm) => {
    const level = getLevel(elm, selectors);
    const isText = elm.matches(selectors.text.selector);
    const content = innerText(elm);
    const anchor = getAnchor(elm);

    if (!content || (typeof level !== 'number' && !isText)) {
      return true;
    } else if (isText) {
      current.text = (current.text ? current.text + '\n' : '') + content.trim();
    } else if (typeof level === 'number') {
      if (current.text && typeof currentLevel === 'number') {
        result.push(current);
      }

      currentLevel = level;
      current = {
        ...current,
        text: '',
        anchor,
        hierarchy: current.hierarchy.map((value, i) =>
          i < level
            ? value || selectors.hierarchy[i].default || null
            : i === level
            ? content
            : null
        ),
      };
    }

    return false;
  });

  if (current.text) {
    result.push(current);
  }

  return result;
}
