import { NodeTree } from './interfaces';

export const SENTENCE: string = 'Colorless green ideas sleep furiously.';
export const TREE: NodeTree = {
  'zaq': {
    id: 'zaq',
    label: 'Adj',
    slice: [0, 9]
  },
  'xsw': {
    id: 'xsw',
    label: 'Adj',
    slice: [10, 15]
  },
  'cde': {
    id: 'cde',
    label: 'N',
    slice: [16, 21]
  },
  'vfr': {
    id: 'vfr',
    label: 'V',
    slice: [22, 27]
  },
  'bgt': {
    id: 'bgt',
    label: 'Adv',
    slice: [28, 37]
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
  }
};
