/**
 * Category utility functions for PT Nirwana Jaya Nugraha
 */

/**
 * Auto-suggest categories based on product name keywords
 * Returns a list of suggested categories based on keywords in the product name
 */
export function categorizeProductName(productName: string): string[] {
  const name = productName.toLowerCase();
  const suggestions: string[] = [];
  
  // Define category keywords and their mappings
  const categoryKeywords: { category: string; keywords: string[] }[] = [
    { category: 'Panel Listrik', keywords: ['panel', 'distribusi', 'listrik', 'box', 'spdr', 'distrivisi'] },
    { category: 'Kabel & Kabel Listrik', keywords: ['kabel', 'wire', 'cable', 'mcm', 'hrc', 'pv', 'u 자에', 'hvs', 'ln'] },
    { category: 'Komponen Listrik', keywords: ['komponen', 'switch', 'socket', 'plug', 'bord', 'terminal', 'relay', 'contact', 'breaker', 'cb', 'mcb', 'fuse', 'lembur'] },
    { category: 'Jala Listrik & Instalasi', keywords: ['jala', 'instalasi', 'mounting', 'lis', 'crow', 'wiring', 'sok'] },
    { category: 'Lighting & Penerangan', keywords: ['lighting', 'penerangan', 'lampu', 'lampu', 'led', 'bol lamps', 'spot', 'flood'] },
    { category: 'Safety & Proteksi', keywords: ['safety', 'proteksi', 'ampermeter', 'voltmeter', 'tester', 'multimeter', 'safety', 'p3t', 'p3l'] },
    { category: 'AC & Kencana', keywords: ['ac', 'kondisioner', 'kencana', 'kulkas', 'refrigeran', 'vapor', 'compressor'] },
    { category: 'Peralatan Energi', keywords: ['energi', 'solar', 'surya', 'battery', 'baterai', 'genset', 'generator', 'inverter', 'stabilizer'] },
    { category: 'Pool & Ketahanan', keywords: ['pool', 'elementary', 'ketahanan', 'kawat', 'untung', 'retakan', 'pipe', 'pipa', 'valve', 'klep'] },
    { category: 'Binding & Tampilan', keywords: ['binding', 'tampilan', 'bau', 'pencahayaan', 'lampu panggung'] }
  ];
  
  // Check each category's keywords
  for (const { category, keywords } of categoryKeywords) {
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        suggestions.push(category);
        break;
      }
    }
  }
  
  // If no keywords matched, return a generic suggestion
  if (suggestions.length === 0) {
    const genericCategories = ['Panel Listrik', 'Kabel & Kabel Listrik', 'Komponen Listrik', 'Jala Listrik & Instalasi'];
    return genericCategories.slice(0, 3);
  }
  
  // Return unique suggestions
  return [...new Set(suggestions)];
}

/**
 * Normalize category name (trim, remove extra spaces, capitalize first letter)
 */
export function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').replace(/^./, (match) => match.toUpperCase());
}

/**
 * Check if a category already exists in the category list (case-insensitive)
 */
export function categoryExists(categories: { name: string }[], categoryName: string): boolean {
  return categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
}