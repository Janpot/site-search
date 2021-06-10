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
  let currentHierarchy: (string | null)[] = [];
  let currentText: string | null = null;
  let currentLevel: number | null = null;
  let currentAnchor: string | null = null;

  walk(root, (elm) => {
    const level = getLevel(elm, selectors);
    const isText = elm.matches(selectors.text.selector);
    const content = innerText(elm);
    const anchor = getAnchor(elm);
    if (!content) {
      return true;
    } else if (typeof level !== 'number' && !isText) {
      return true;
    } else if (isText) {
      currentText = (currentText ? currentText + '\n' : '') + content.trim();
    } else if (typeof level === 'number' && typeof currentLevel === 'number') {
      if (!currentText && currentLevel < level) {
        currentLevel = level;
        currentHierarchy[level] = content;
      } else {
        if (currentText) {
          result.push({
            hierarchy: [...currentHierarchy],
            text: currentText,
            anchor: currentAnchor,
          });
        }
        currentHierarchy = currentHierarchy.slice(0, level + 1);
        currentText = null;
        currentAnchor = null;
        currentHierarchy[level] = content;
      }
      if (anchor) {
        currentAnchor = anchor;
      }
    } else if (typeof level === 'number') {
      currentLevel = level;
      currentHierarchy[level] = content;
      if (anchor) {
        currentAnchor = anchor;
      }
    }
    return false;
  });

  if (currentText) {
    result.push({
      hierarchy: [...currentHierarchy],
      text: currentText,
      anchor: currentAnchor,
    });
  }

  return result;
}
