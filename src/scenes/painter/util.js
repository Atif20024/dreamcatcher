import Phaser from 'phaser';

export const T = 32;
export const px = (tile) => tile * T + T / 2;
export const overlaps = (a, b) => Phaser.Geom.Intersects.RectangleToRectangle(a, b);
export const hex = (c) => `#${(c >>> 0).toString(16).padStart(6, '0')}`;
