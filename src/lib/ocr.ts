import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export async function extractTextFromImage(imageFile: File): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(
      imageFile,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      }
    );

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

export interface ParsedReceipt {
  merchant?: string;
  total?: number;
  date?: Date;
  items?: string[];
  rawText: string;
}

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').filter(line => line.trim());
  
  let total: number | undefined;
  
  const totalRegex = /(?:total|amount\s+due|balance\s+due)[:\s]*\$?\s*(\d+\.\d{2})/gi;
  const totalMatch = totalRegex.exec(text);
  if (totalMatch) {
    total = parseFloat(totalMatch[1]);
  }
  
  if (!total) {
    const lineRegex = /^.*total.*\$?\s*(\d+\.\d{2})/gim;
    const matches = text.matchAll(lineRegex);
    for (const match of matches) {
      const amount = parseFloat(match[1]);
      if (amount > 0) {
        total = amount;
        break;
      }
    }
  }
  
  if (!total) {
    const amountRegex = /\$?\s*(\d+\.\d{2})/g;
    const amounts: number[] = [];
    let match;
    while ((match = amountRegex.exec(text)) !== null) {
      const amount = parseFloat(match[1]);
      if (amount > 0) {
        amounts.push(amount);
      }
    }
    
    if (amounts.length > 0) {
      total = Math.max(...amounts);
    }
  }

  const knownMerchants = [
    'walmart', 'target', 'costco', 'whole foods', 'trader joe', 'kroger', 'safeway',
    'mcdonalds', 'starbucks', 'chipotle', 'subway', 'wendys', 'taco bell',
    'amazon', 'best buy', 'home depot', 'lowes', 'cvs', 'walgreens',
    'shell', 'chevron', 'exxon', 'bp', 'mobil', 'arco'
  ];

  const skipPatterns = [
    /give.*feedback/i,
    /survey\./i,
    /www\./i,
    /http/i,
    /^\d+$/,
    /receipt/i,
    /thank you/i,
    /store #/i,
    /^\*+$/,
    /^-+$/,
    /^=+$/,
  ];

  let merchant: string | undefined;

  for (const line of lines) {
    const lineLower = line.toLowerCase().trim();
    
    if (skipPatterns.some(pattern => pattern.test(line))) {
      continue;
    }

    if (line.length < 3 || line.length > 50) {
      continue;
    }

    const foundMerchant = knownMerchants.find(m => lineLower.includes(m));
    if (foundMerchant) {
      merchant = foundMerchant.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      break;
    }

    if (!merchant && line.match(/^[A-Za-z\s&'-]+$/) && line.length > 3) {
      merchant = line.trim();
      break;
    }
  }

  if (!merchant) {
    merchant = lines[0]?.trim() || undefined;
  }

  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g;
  const dateMatch = text.match(dateRegex);
  let date: Date | undefined;
  
  if (dateMatch && dateMatch[0]) {
    const parsedDate = new Date(dateMatch[0]);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate;
    }
  }

  return {
    merchant,
    total,
    date,
    items: lines.slice(1, Math.min(10, lines.length)),
    rawText: text,
  };
}

