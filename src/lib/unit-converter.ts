// Utility functions for converting units
// 1 metric tonne = 1000 kg

export const kgToMetricTonnes = (kg: number): number => {
  return kg / 1000;
};

export const formatMetricTonnes = (kg: number, decimals: number = 2): string => {
  const tonnes = kgToMetricTonnes(kg);
  return `${tonnes.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} MT`;
};

export const formatMetricTonnesShort = (kg: number): string => {
  const tonnes = kgToMetricTonnes(kg);
  if (tonnes >= 1000) {
    return `${(tonnes / 1000).toFixed(1)}K MT`;
  }
  return `${tonnes.toFixed(1)} MT`;
};

// Sugar type weight mappings (in kg)
export const sugarTypeWeights: Record<string, number> = {
  'bale_2x10': 20,  // 2x10 = 20kg per bale
  'bale_1x20': 20,  // 1x20 = 20kg per bale
  'bale_1x12': 12,  // 1x12 = 12kg per bale
  'bag_50kg': 50,   // 50kg bag
  'bag_25kg': 25,   // 25kg bag
};

export const sugarTypeLabels: Record<string, string> = {
  'bale_2x10': 'Bale 2×10 (20kg)',
  'bale_1x20': 'Bale 1×20 (20kg)',
  'bale_1x12': 'Bale 1×12 (12kg)',
  'bag_50kg': 'Bag 50kg',
  'bag_25kg': 'Bag 25kg',
};

export const getSugarTypeCategory = (type: string): 'bale' | 'bag' => {
  return type.startsWith('bale') ? 'bale' : 'bag';
};
