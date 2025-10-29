import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, eachMonthOfInterval, startOfYear } from 'date-fns';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  merchant: string;
  category_id: string;
  date: string;
  receipt_url?: string;
  raw_ocr_text?: string;
  is_recurring: boolean;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithTransactions {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export function calculateTotalSpending(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
}

export function groupByCategory(
  transactions: Transaction[],
  categories: Array<{ id: string; name: string; icon: string; color: string }>
): CategoryWithTransactions[] {
  const total = calculateTotalSpending(transactions);
  
  const grouped = categories.map(category => {
    const categoryTransactions = transactions.filter(
      tx => tx.category_id === category.id
    );
    
    const categoryTotal = calculateTotalSpending(categoryTransactions);
    
    return {
      ...category,
      total: categoryTotal,
      count: categoryTransactions.length,
      percentage: total > 0 ? (categoryTotal / total) * 100 : 0,
    };
  }).filter(cat => cat.count > 0);

  return grouped.sort((a, b) => b.total - a.total);
}

export function getSpendingByDay(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Array<{ date: string; amount: number }> {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter(tx => tx.date === dayStr);
    const amount = calculateTotalSpending(dayTransactions);
    
    return {
      date: format(day, 'MMM dd'),
      amount,
    };
  });
}

export function getSpendingByMonth(
  transactions: Transaction[],
  monthsBack: number = 6
): Array<{ month: string; amount: number }> {
  const now = new Date();
  const startDate = subMonths(startOfMonth(now), monthsBack - 1);
  const endDate = endOfMonth(now);
  
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  
  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthStr = format(month, 'MMM yyyy');
    
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });
    
    return {
      month: format(month, 'MMM'),
      amount: calculateTotalSpending(monthTransactions),
    };
  });
}

export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[]
): {
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
} {
  const spent = calculateTotalSpending(
    transactions.filter(tx => tx.category_id === budget.category_id)
  );
  
  const remaining = budget.amount - spent;
  const percentage = (spent / budget.amount) * 100;
  
  return {
    spent,
    remaining,
    percentage: Math.min(percentage, 100),
    isOverBudget: spent > budget.amount,
  };
}

export function getTopCategories(
  categoryData: CategoryWithTransactions[],
  limit: number = 5
): CategoryWithTransactions[] {
  return categoryData
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function getAverageDailySpending(
  transactions: Transaction[],
  days: number = 30
): number {
  const total = calculateTotalSpending(transactions);
  return total / days;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getSpendingInsights(
  currentMonthTransactions: Transaction[],
  previousMonthTransactions: Transaction[]
): {
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
} {
  const currentTotal = calculateTotalSpending(currentMonthTransactions);
  const previousTotal = calculateTotalSpending(previousMonthTransactions);
  
  const change = currentTotal - previousTotal;
  const changePercentage = previousTotal > 0 
    ? (change / previousTotal) * 100 
    : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(changePercentage) > 5) {
    trend = change > 0 ? 'up' : 'down';
  }
  
  return {
    change,
    changePercentage,
    trend,
  };
}

