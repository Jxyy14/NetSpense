import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDemoUserId } from "@/lib/mock-user";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  formatCurrency, 
  getSpendingByMonth,
  groupByCategory,
  calculateTotalSpending,
  getSpendingInsights,
} from "@/lib/finance-utils";
import { 
  TrendingUp, TrendingDown, Calendar, DollarSign,
  PieChart as PieChartIcon, Activity, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format, startOfYear } from "date-fns";
import type { Transaction } from "@/lib/finance-utils";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function FinanceAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [timeRange, setTimeRange] = useState("6months");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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

      // Load transactions for the past year
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(subMonths(new Date(), 12), 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Calculate insights
  const currentMonth = transactions.filter(tx => 
    new Date(tx.date) >= startOfMonth(new Date())
  );
  
  const previousMonth = transactions.filter(tx => {
    const date = new Date(tx.date);
    const prevStart = startOfMonth(subMonths(new Date(), 1));
    const prevEnd = endOfMonth(subMonths(new Date(), 1));
    return date >= prevStart && date <= prevEnd;
  });

  const insights = getSpendingInsights(currentMonth, previousMonth);
  const monthlyData = getSpendingByMonth(transactions, timeRange === "6months" ? 6 : 12);
  const categoryData = groupByCategory(currentMonth, categories);
  
  // Year-to-date calculations
  const ytdTransactions = transactions.filter(tx => 
    new Date(tx.date) >= startOfYear(new Date())
  );
  const ytdTotal = calculateTotalSpending(ytdTransactions);
  const monthlyAverage = ytdTotal / (new Date().getMonth() + 1);

  // Top spending days of week
  const dayOfWeekData = [
    { day: 'Mon', amount: 0 },
    { day: 'Tue', amount: 0 },
    { day: 'Wed', amount: 0 },
    { day: 'Thu', amount: 0 },
    { day: 'Fri', amount: 0 },
    { day: 'Sat', amount: 0 },
    { day: 'Sun', amount: 0 },
  ];

  currentMonth.forEach(tx => {
    const dayIndex = new Date(tx.date).getDay();
    // Convert Sunday (0) to index 6
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    dayOfWeekData[adjustedIndex].amount += Number(tx.amount);
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Deep dive into your spending patterns and trends
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ytdTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Year to date spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Avg</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyAverage)}</div>
            <p className="text-xs text-muted-foreground">
              Average per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(calculateTotalSpending(currentMonth))}
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
                {Math.abs(insights.changePercentage).toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">
              Active categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Spending Trends</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Spending Patterns</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>
                Track how your spending changes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
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
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>Month-over-month comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="text-sm font-medium">Current Month</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(calculateTotalSpending(currentMonth))}
                      </p>
                    </div>
                    {insights.trend === 'up' ? (
                      <TrendingUp className="h-8 w-8 text-red-500" />
                    ) : insights.trend === 'down' ? (
                      <TrendingDown className="h-8 w-8 text-green-500" />
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Previous Month</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(calculateTotalSpending(previousMonth))}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Change</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      insights.trend === 'up' ? 'text-red-500' :
                      insights.trend === 'down' ? 'text-green-500' : ''
                    }`}>
                      {insights.change >= 0 ? '+' : ''}{formatCurrency(insights.change)}
                      <span className="text-sm ml-2">
                        ({insights.changePercentage >= 0 ? '+' : ''}{insights.changePercentage.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending Velocity</CardTitle>
                <CardDescription>Daily average by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value / 30)}
                      labelFormatter={(label) => `${label} (daily avg)`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Spending distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis tickFormatter={(value) => `$${value}`} />
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

          <div className="grid gap-4">
            {categoryData.map((category) => (
              <Card key={category.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.count} {category.count === 1 ? 'transaction' : 'transactions'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(category.total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Day of Week</CardTitle>
              <CardDescription>
                Identify which days you spend the most
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Bar dataKey="amount" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Peak Spending Day</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const maxDay = dayOfWeekData.reduce((max, day) => 
                    day.amount > max.amount ? day : max
                  , dayOfWeekData[0]);
                  return (
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {maxDay.day}
                      </div>
                      <div className="text-2xl font-semibold mb-1">
                        {formatCurrency(maxDay.amount)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This is your highest spending day
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {currentMonth.length}
                  </div>
                  <div className="text-lg font-semibold mb-1">
                    Transactions this month
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average: {(currentMonth.length / new Date().getDate()).toFixed(1)} per day
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

