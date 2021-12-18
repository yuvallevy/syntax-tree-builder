import React from 'react';

export const Adopt = () => <svg id="i-adopt" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
  <g transform="translate(7.25,-0.25)">
    <rect x={8} y={1} width={16} height={10.5} rx={2} />
    <rect x={8} y={21} width={16} height={10.5} rx={2} />
    <line x1={16} y1={13} x2={16} y2={19.5} />
  </g>
  <g transform="translate(-7.25,-0.75)">
    <line x1={8} y1={16} x2={12} y2={16} />
    <line x1={20} y1={16} x2={24} y2={16} />
    <line x1={16} y1={8} x2={16} y2={12} />
    <line x1={16} y1={20} x2={16} y2={24} />
    <line x1={10.3} y1={10.3} x2={13.3} y2={13.3} />
    <line x1={18.7} y1={18.7} x2={21.7} y2={21.7} />
    <line x1={10.3} y1={21.7} x2={13.3} y2={18.7} />
    <line x1={18.7} y1={13.3} x2={21.7} y2={10.3} />
  </g>
</svg>;

export const Disown = () => <svg id="i-disown" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
  <g transform="translate(7.25,-0.25)">
    <rect x={8} y={1} width={16} height={10.5} rx={2} />
    <rect x={8} y={21} width={16} height={10.5} rx={2} strokeDasharray="2 3" />
    <line x1={16} y1={13} x2={16} y2={19.5} strokeDasharray="2 3" />
  </g>
  <g transform="translate(-7.25,-0.75)">
    <line x1={10} y1={10} x2={22} y2={22} />
    <line x1={10} y1={22} x2={22} y2={10} />
  </g>
</svg>;

export const Undo = () => <svg id="i-undo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
  <path d="M 6.5 27.5 L 18.5 27.5 A 1 1 0 0 0 18.5 8.5 L 4.5 8.5 m 5 -5 l -5 5 l 5 5"></path>
</svg>

export const Redo = () => <svg id="i-redo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentcolor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
  <path d="M 25.5 27.5 L 14 27.5 A 1 1 0 0 1 13.5 8.5 L 27.5 8.5 m -5 -5 l 5 5 l -5 5"></path>
</svg>
