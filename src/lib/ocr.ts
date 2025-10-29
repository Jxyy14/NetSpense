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
  
  const amountRegex = /\$?\s*(\d+\.\d{2})|total[:\s]*\$?\s*(\d+\.\d{2})/gi;
  let total: number | undefined;
  
  const amounts: number[] = [];
  let match;
  while ((match = amountRegex.exec(text)) !== null) {
    const amount = parseFloat(match[1] || match[2]);
    if (amount > 0) {
      amounts.push(amount);
    }
  }
  
  if (amounts.length > 0) {
    total = Math.max(...amounts);
  }

  const merchant = lines[0]?.trim() || undefined;

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

