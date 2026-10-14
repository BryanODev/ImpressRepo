'use strict';

window.ProductionDefaults = [
  {
    id: 'flyers-default',
    name: 'Flyers',
    area: 'Printing',
    steps: ['Design approved', 'Print', 'Cut', 'Package'],
  },
  {
    id: 'dboard-default',
    name: 'DBoard',
    area: 'Board Production',
    steps: ['Design approved', 'Print', 'Mount on board', 'Terminations', 'Quality check'],
  },
  {
    id: 'acm-default',
    name: 'ACM',
    area: 'Board Production',
    steps: ['Design approved', 'CNC cutting', 'Print application', 'Terminations', 'Quality check'],
  },
];
