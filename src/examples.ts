import { NodeTree } from './interfaces';

export const SENTENCE: string = 'Noam Chomsky claims that colorless green ideas sleep furiously.';
export const TREE: NodeTree = {
  'qwe': {
    id: 'qwe',
    label: 'NP',
    slice: [0, 12],
    triangle: true
  },
  'rty': {
    id: 'rty',
    label: 'V',
    slice: [13, 19],
    triangle: false
  },
  'uio': {
    id: 'uio',
    label: 'Comp',
    slice: [20, 24],
    triangle: false
  },
  'zaq': {
    id: 'zaq',
    label: 'Adj',
    slice: [25, 34],
    triangle: false
  },
  'xsw': {
    id: 'xsw',
    label: 'Adj',
    slice: [35, 40],
    triangle: false
  },
  'cde': {
    id: 'cde',
    label: 'N',
    slice: [41, 46],
    triangle: false
  },
  'vfr': {
    id: 'vfr',
    label: 'V',
    slice: [47, 52],
    triangle: false
  },
  'bgt': {
    id: 'bgt',
    label: 'Adv',
    slice: [53, 62],
    triangle: false
  },
  'nhy': {
    id: 'nhy',
    label: 'NP',
    children: ['xsw', 'cde']
  },
  'mju': {
    id: 'mju',
    label: 'NP',
    children: ['zaq', 'nhy']
  },
  'ki8': {
    id: 'ki8',
    label: 'VP',
    children: ['vfr', 'bgt']
  },
  'lo9': {
    id: 'lo9',
    label: 'S',
    children: ['mju', 'ki8']
  },
  'asd': {
    id: 'asd',
    label: 'S\'',
    children: ['uio', 'lo9']
  },
  'fgh': {
    id: 'fgh',
    label: 'VP',
    children: ['rty', 'asd']
  },
  'jkl': {
    id: 'jkl',
    label: 'S',
    children: ['qwe', 'fgh']
  }
};
