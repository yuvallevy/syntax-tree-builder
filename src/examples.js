export const SENTENCE = 'Colorless green ideas sleep furiously.';
export const TREE = {
  0: {
    label: 'Adj',
    slice: [0, 9]
  },
  1: {
    label: 'Adj',
    slice: [10, 15]
  },
  2: {
    label: 'N',
    slice: [16, 21]
  },
  3: {
    label: 'V',
    slice: [22, 27]
  },
  4: {
    label: 'Adv',
    slice: [28, 37]
  },
  5: {
    label: 'NP',
    children: [1, 2]
  },
  6: {
    label: 'NP',
    children: [0, 5]
  },
  7: {
    label: 'VP',
    children: [3, 4]
  },
  8: {
    label: 'S',
    children: [6, 7]
  }
};
