export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export function categorizeTransaction(
  description: string,
  merchant: string,
  categories: Category[]
): Category | null {
  if (!description && !merchant) return null;

  const text = `${description} ${merchant}`.toLowerCase();
  
  const scores = categories.map(category => {
    let score = 0;
    
    category.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      if (text.includes(keywordLower)) {
        const wordRegex = new RegExp(`\\b${keywordLower}\\b`, 'i');
        if (wordRegex.test(text)) {
          score += 10;
        } else {
          score += 5;
        }
      }
      
      const words = text.split(/\s+/);
      words.forEach(word => {
        if (word.includes(keywordLower) || keywordLower.includes(word)) {
          score += 2;
        }
      });
    });

    return { category, score };
  });

  scores.sort((a, b) => b.score - a.score);
  
  if (scores[0] && scores[0].score > 0) {
    return scores[0].category;
  }

  return categories.find(c => c.name === 'Discretionary') || null;
}

export function categorizeBatch(
  transactions: Array<{ description: string; merchant: string }>,
  categories: Category[]
): Category[] {
  return transactions.map(tx => 
    categorizeTransaction(tx.description, tx.merchant, categories) || 
    categories.find(c => c.name === 'Discretionary')!
  );
}

export function calculateAccuracy(
  predictions: Category[],
  actual: Category[]
): number {
  if (predictions.length !== actual.length) return 0;
  
  const correct = predictions.filter((pred, idx) => 
    pred.id === actual[idx].id
  ).length;
  
  return (correct / predictions.length) * 100;
}

