import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDemoUserId } from "@/lib/mock-user";
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Receipt, 
  Calendar, AlertCircle, Plus, ArrowUpRight, ArrowDownRight 
} from "lucide-react";
import { 
  formatCurrency, 
  groupByCategory, 
  getSpendingByMonth,
  calculateTotalSpending,
  getSpendingInsights 
} from "@/lib/finance-utils";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import type { Transaction } from "@/lib/finance-utils";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [previousMonthTotal, setPreviousMonthTotal] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const userId = getDemoUserId();

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load transactions for current and previous month
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(subMonths(now, 6), 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Calculate totals
      const currentMonth = (transactionsData || []).filter(tx => 
        new Date(tx.date) >= currentMonthStart
      );
      const previousMonth = (transactionsData || []).filter(tx => {
        const date = new Date(tx.date);
        return date >= previousMonthStart && date <= previousMonthEnd;
      });

      setCurrentMonthTotal(calculateTotalSpending(currentMonth));
      setPreviousMonthTotal(calculateTotalSpending(previousMonth));

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const currentMonthTransactions = transactions.filter(tx => 
    new Date(tx.date) >= startOfMonth(new Date())
  );

  const previousMonthTransactions = transactions.filter(tx => {
    const date = new Date(tx.date);
    const prevMonthStart = startOfMonth(subMonths(new Date(), 1));
    const prevMonthEnd = endOfMonth(subMonths(new Date(), 1));
    return date >= prevMonthStart && date <= prevMonthEnd;
  });

  const insights = getSpendingInsights(currentMonthTransactions, previousMonthTransactions);
  const categoryData = groupByCategory(currentMonthTransactions, categories);
  const monthlyData = getSpendingByMonth(transactions, 6);
  const topCategories = categoryData.slice(0, 5);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your financial dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Track your expenses and stay on budget
          </p>
        </div>
        <Button className="gap-2" onClick={() => window.location.href = '/upload'}>
          <Plus className="h-4 w-4" />
          Add Receipt
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthTotal)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {insights.trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
              ) : insights.trend === 'down' ? (
                <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
              ) : null}
              <span className={
                insights.trend === 'up' ? 'text-red-500' :
                insights.trend === 'down' ? 'text-green-500' : ''
              }>
                {Math.abs(insights.changePercentage).toFixed(1)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthTotal / new Date().getDate())}
            </div>
            <p className="text-xs text-muted-foreground">
              Average per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <div className="text-2xl">{topCategories[0]?.icon || '📊'}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topCategories[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topCategories[0] ? formatCurrency(topCategories[0].total) : '$0.00'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Alert */}
      {insights.trend === 'up' && Math.abs(insights.changePercentage) > 20 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your spending is up {Math.abs(insights.changePercentage).toFixed(1)}% 
            compared to last month. Consider reviewing your recent transactions.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Spending Trend */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Your spending over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>This month's breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => 
                    percentage > 5 ? `${name} ${percentage.toFixed(0)}%` : ''
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCategories}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Bar dataKey="total" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest expenses</CardDescription>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/transactions'}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentMonthTransactions.slice(0, 5).map((transaction) => {
              const category = categories.find(c => c.id === transaction.category_id);
              return (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{category?.icon || '💰'}</div>
                    <div>
                      <p className="font-medium">{transaction.merchant || transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')} • {category?.name}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold">
                    {formatCurrency(Number(transaction.amount))}
                  </div>
                </div>
              );
            })}
            {currentMonthTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet this month</p>
                <Button className="mt-4" onClick={() => window.location.href = '/upload'}>
                  Upload Your First Receipt
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

