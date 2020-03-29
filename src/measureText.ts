const MEASUREMENT_ELEMENT_ID: string = 'text-measurement';

const cache: { [str: string]: number } = {};

function getMeasurementElement(): HTMLElement {
  let el = document.getElementById(MEASUREMENT_ELEMENT_ID);
  if (!el) {
    const measurementElement: HTMLElement = document.createElement('span');
    measurementElement.id = MEASUREMENT_ELEMENT_ID;
    measurementElement.style.position = 'absolute';
    measurementElement.style.left = '-100%';
    measurementElement.style.top = '-100%';
    measurementElement.style.padding = '0';
    measurementElement.style.whiteSpace = 'pre';
    document.body.appendChild(measurementElement);
    el = document.getElementById(MEASUREMENT_ELEMENT_ID) as HTMLElement;
  }
  return el;
}

export function measureText(str: string): number {
  if (cache[str]) {
    return cache[str];
  }

  let el = getMeasurementElement();
  el.innerText = str;
  const width: number = el.getBoundingClientRect().width;
  cache[str] = width;
  return width;
}
