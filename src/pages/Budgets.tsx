import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateBudgetProgress } from "@/lib/finance-utils";
import { getDemoUserId } from "@/lib/mock-user";
import { Plus, Target, AlertCircle, TrendingUp, Edit, Trash2 } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import type { Transaction, Budget } from "@/lib/finance-utils";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function Budgets() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    period: "monthly" as "weekly" | "monthly" | "yearly",
  });

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

      // Load budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (budgetsError) throw budgetsError;
      setBudgets(budgetsData || []);

      // Load current month transactions
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading budgets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBudget(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.category_id || !formData.amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = getDemoUserId();

      const { error } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          category_id: formData.category_id,
          amount: parseFloat(formData.amount),
          period: formData.period,
          start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Budget created!",
        description: "Your budget has been set successfully",
      });

      setShowCreateDialog(false);
      setFormData({ category_id: "", amount: "", period: "monthly" });
      loadData();

    } catch (error: any) {
      console.error('Error creating budget:', error);
      toast({
        title: "Error creating budget",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleDeleteBudget(id: string) {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setBudgets(prev => prev.filter(b => b.id !== id));
      toast({
        title: "Budget deleted",
        description: "The budget has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting budget",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  const budgetProgress = budgets.map(budget => {
    const category = categories.find(c => c.id === budget.category_id);
    const progress = calculateBudgetProgress(budget, transactions);
    return {
      budget,
      category,
      ...progress,
    };
  });

  const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgetProgress.reduce((sum, bp) => sum + bp.spent, 0);
  const overBudgetCount = budgetProgress.filter(bp => bp.isOverBudget).length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading budgets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Tracking</h1>
          <p className="text-muted-foreground">
            Set spending limits and track your progress
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Set a spending limit for a category
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Budget Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select 
                  value={formData.period} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, period: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Create Budget</Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</div>
            <p className="text-xs text-muted-foreground">
              {budgets.length} {budgets.length === 1 ? 'budget' : 'budgets'} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <Progress 
              value={totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Math.max(0, totalBudgeted - totalSpent))}
            </div>
            <p className="text-xs text-muted-foreground">
              {overBudgetCount > 0 && `${overBudgetCount} over budget`}
            </p>
          </CardContent>
        </Card>
      </div>

      {overBudgetCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Warning: {overBudgetCount} {overBudgetCount === 1 ? 'category is' : 'categories are'} over budget this month!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {budgetProgress.length > 0 ? (
          budgetProgress.map(({ budget, category, spent, remaining, percentage, isOverBudget }) => (
            <Card key={budget.id} className={isOverBudget ? 'border-destructive' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{category?.icon || '💰'}</div>
                    <div>
                      <CardTitle>{category?.name || 'Unknown Category'}</CardTitle>
                      <CardDescription className="capitalize">{budget.period} budget</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-medium">{formatCurrency(spent)}</span>
                </div>
                <Progress 
                  value={percentage} 
                  className={isOverBudget ? '[&>div]:bg-destructive' : ''}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isOverBudget ? 'Over budget by' : 'Remaining'}
                  </span>
                  <span className={`font-medium ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(remaining))}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Budget Limit</span>
                  <span className="text-lg font-bold">{formatCurrency(Number(budget.amount))}</span>
                </div>
                {percentage > 80 && !isOverBudget && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You've used {percentage.toFixed(0)}% of your budget. Consider reducing spending in this category.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No budgets set</p>
                <p className="text-sm mb-4">Create your first budget to start tracking your spending goals</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Budget
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

