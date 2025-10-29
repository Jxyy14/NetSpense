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

  const merchantLower = (merchant || '').toLowerCase().trim();
  const descLower = (description || '').toLowerCase().trim();
  
  const scores = categories.map(category => {
    let score = 0;
    
    category.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const keywordWords = keywordLower.split(/\s+/);
      
      const exactMerchantMatch = merchantLower === keywordLower;
      if (exactMerchantMatch) {
        score += 100;
        return;
      }
      
      const merchantStartsWith = merchantLower.startsWith(keywordLower);
      if (merchantStartsWith) {
        score += 80;
        return;
      }
      
      const merchantWordBoundary = new RegExp(`\\b${keywordLower}\\b`, 'i');
      if (merchantWordBoundary.test(merchantLower)) {
        score += 50;
        return;
      }
      
      if (merchantLower.includes(keywordLower)) {
        score += 30;
      }
      
      const allKeywordWordsInMerchant = keywordWords.every(kw => 
        merchantLower.includes(kw)
      );
      if (allKeywordWordsInMerchant && keywordWords.length > 1) {
        score += 40;
      }
      
      const descWordBoundary = new RegExp(`\\b${keywordLower}\\b`, 'i');
      if (descWordBoundary.test(descLower)) {
        score += 15;
      } else if (descLower.includes(keywordLower)) {
        score += 8;
      }
      
      const levenshteinDistance = (s1: string, s2: string): number => {
        const len1 = s1.length;
        const len2 = s2.length;
        const matrix: number[][] = [];
        
        for (let i = 0; i <= len1; i++) {
          matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
          matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len1; i++) {
          for (let j = 1; j <= len2; j++) {
            if (s1[i - 1] === s2[j - 1]) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }
        
        return matrix[len1][len2];
      };
      
      const distance = levenshteinDistance(merchantLower, keywordLower);
      const maxLen = Math.max(merchantLower.length, keywordLower.length);
      const similarity = 1 - (distance / maxLen);
      
      if (similarity > 0.8) {
        score += 60;
      } else if (similarity > 0.7) {
        score += 40;
      } else if (similarity > 0.6) {
        score += 20;
      }
    });

    return { category, score };
  });

  scores.sort((a, b) => b.score - a.score);
  
  if (scores[0] && scores[0].score >= 10) {
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

