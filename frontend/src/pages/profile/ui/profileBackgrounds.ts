import type { ProfileGradient } from '../model/types';

export const gradients: ProfileGradient[] = [
  { name: 'Purple Blue', value: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
  { name: 'Orange Red', value: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' },
  { name: 'Green Emerald', value: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
  { name: 'Pink Rose', value: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' },
  { name: 'Blue Cyan', value: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
  { name: 'Yellow Amber', value: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
  { name: 'Indigo Purple', value: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
  { name: 'Teal Cyan', value: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)' },
  { name: 'Red Pink', value: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' },
  { name: 'Multi Color', value: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #f97316 70%, #fb923c 100%)' },
  { name: 'Dotted Purple', value: 'radial-gradient(circle, #8b5cf6 1px, transparent 1px), linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
  { name: 'Dotted Orange', value: 'radial-gradient(circle, #fb923c 1.5px, transparent 1.5px), linear-gradient(135deg, #f97316 0%, #fb923c 100%)' },
  { name: 'Dotted Green', value: 'radial-gradient(circle, #34d399 1px, transparent 1px), linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
  { name: 'Diagonal Stripes', value: 'repeating-linear-gradient(45deg, #6366f1 0px, #6366f1 10px, #8b5cf6 10px, #8b5cf6 20px)' },
  { name: 'Chevron Pattern', value: 'repeating-linear-gradient(45deg, #f97316 0px, #f97316 8px, #fb923c 8px, #fb923c 16px)' },
  { name: 'Zigzag Pattern', value: 'repeating-linear-gradient(90deg, #10b981 0px, #10b981 12px, #34d399 12px, #34d399 24px)' },
  { name: 'Radial Burst', value: 'radial-gradient(circle at center, #ec4899 0%, #f472b6 50%, #ec4899 100%)' },
  { name: 'Radial Sunset', value: 'radial-gradient(circle at 30% 70%, #f59e0b 0%, #fbbf24 50%, #fb923c 100%)' },
  { name: 'Radial Ocean', value: 'radial-gradient(circle at top right, #3b82f6 0%, #06b6d4 50%, #14b8a6 100%)' },
  { name: 'Wave Pattern', value: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(99, 102, 241, 0.15) 2px, rgba(99, 102, 241, 0.15) 4px), linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
];

export const GRADIENTS_PER_PAGE = 6;
