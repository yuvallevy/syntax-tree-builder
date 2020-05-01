import { NodeTree } from './interfaces';

export const SENTENCE: string = 'Noam Chomsky claims that colorless green ideas sleep furiously.';
export const TREE: NodeTree = {
  'qwe': {
    id: 'qwe',
    label: 'NP',
    slice: [0, 12],
    triangle: true,
    offsetX: 0,
    offsetY: -200
  },
  'rty': {
    id: 'rty',
    label: 'V',
    slice: [13, 19],
    triangle: false,
    offsetX: 0,
    offsetY: -160
  },
  'uio': {
    id: 'uio',
    label: 'Comp',
    slice: [20, 24],
    triangle: false,
    offsetX: 4,
    offsetY: -120
  },
  'zaq': {
    id: 'zaq',
    label: 'Adj',
    slice: [25, 34],
    triangle: false,
    offsetX: 8,
    offsetY: 0
  },
  'xsw': {
    id: 'xsw',
    label: 'Adj',
    slice: [35, 40],
    triangle: false,
    offsetX: -4,
    offsetY: 0
  },
  'cde': {
    id: 'cde',
    label: 'N',
    slice: [41, 46],
    triangle: false,
    offsetX: 0,
    offsetY: 0
  },
  'vfr': {
    id: 'vfr',
    label: 'V',
    slice: [47, 52],
    triangle: false,
    offsetX: 4,
    offsetY: 0
  },
  'bgt': {
    id: 'bgt',
    label: 'Adv',
    slice: [53, 62],
    triangle: false,
    offsetX: -4,
    offsetY: 0
  },
  'nhy': {
    id: 'nhy',
    label: 'NP',
    children: ['xsw', 'cde'],
    offsetX: 0,
    offsetY: 0
  },
  'mju': {
    id: 'mju',
    label: 'NP',
    children: ['zaq', 'nhy'],
    offsetX: 0,
    offsetY: 0
  },
  'ki8': {
    id: 'ki8',
    label: 'VP',
    children: ['vfr', 'bgt'],
    offsetX: 0,
    offsetY: 0
  },
  'lo9': {
    id: 'lo9',
    label: 'S',
    children: ['mju', 'ki8'],
    offsetX: 0,
    offsetY: 0
  },
  'asd': {
    id: 'asd',
    label: 'S\'',
    children: ['uio', 'lo9'],
    offsetX: 0,
    offsetY: 0
  },
  'fgh': {
    id: 'fgh',
    label: 'VP',
    children: ['rty', 'asd'],
    offsetX: 0,
    offsetY: -5
  },
  'jkl': {
    id: 'jkl',
    label: 'S',
    children: ['qwe', 'fgh'],
    offsetX: 0,
    offsetY: -10
  }
};
