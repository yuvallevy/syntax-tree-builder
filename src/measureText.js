const MEASUREMENT_ELEMENT_ID = 'text-measurement';

const cache = {};

export function measureText(str) {
  if (cache[str]) {
    return cache[str];
  }

  let el = document.getElementById(MEASUREMENT_ELEMENT_ID);
  if (!el) {
    const measurementElement = document.createElement('span');
    measurementElement.id = MEASUREMENT_ELEMENT_ID;
    measurementElement.style.position = 'absolute';
    measurementElement.style.left = '-100%';
    measurementElement.style.top = '-100%';
    measurementElement.style.padding = 0;
    measurementElement.style.whiteSpace = 'pre';
    document.body.appendChild(measurementElement);
    el = document.getElementById(MEASUREMENT_ELEMENT_ID);
  }
  el.innerText = str;
  const width = el.getBoundingClientRect().width;
  cache[str] = width;
  return width;
}
