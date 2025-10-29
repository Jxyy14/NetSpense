import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/finance-utils";
import { getDemoUserId } from "@/lib/mock-user";
import { Search, Filter, Download, Edit, Trash2, Receipt, Plus } from "lucide-react";
import { format } from "date-fns";
import type { Transaction } from "@/lib/finance-utils";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function Transactions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    merchant: "",
    amount: "",
    description: "",
    category_id: "",
    date: "",
    notes: "",
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

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading transactions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setEditFormData({
      merchant: transaction.merchant || "",
      amount: transaction.amount.toString(),
      description: transaction.description || "",
      category_id: transaction.category_id,
      date: transaction.date,
      notes: transaction.notes || "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          merchant: editFormData.merchant,
          amount: parseFloat(editFormData.amount),
          description: editFormData.description,
          category_id: editFormData.category_id,
          date: editFormData.date,
          notes: editFormData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      toast({
        title: "Transaction updated",
        description: "Changes have been saved",
      });

      setEditingTransaction(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error updating transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  function exportToCSV() {
    const headers = ['Date', 'Merchant', 'Amount', 'Category', 'Description', 'Notes'];
    const rows = filteredTransactions.map(tx => {
      const category = categories.find(c => c.id === tx.category_id);
      return [
        tx.date,
        tx.merchant || '',
        tx.amount,
        category?.name || '',
        tx.description || '',
        tx.notes || '',
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  }

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || tx.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all your expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => window.location.href = '/upload'} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by merchant or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Transactions</CardDescription>
            <CardTitle className="text-3xl">{filteredTransactions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Amount</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(totalAmount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Transaction</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
              const category = categories.find(c => c.id === transaction.category_id);
              return (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{category?.icon || '💰'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {transaction.merchant || transaction.description || 'Untitled Transaction'}
                        </p>
                        {transaction.receipt_url && (
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                        <Badge variant="outline" style={{ borderColor: category?.color }}>
                          {category?.name}
                        </Badge>
                      </div>
                      {transaction.description && transaction.merchant && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrency(Number(transaction.amount))}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Transaction</DialogTitle>
                            <DialogDescription>
                              Update the transaction details
                            </DialogDescription>
                          </DialogHeader>
                          {editingTransaction && (
                            <form onSubmit={handleUpdate} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-merchant">Merchant</Label>
                                <Input
                                  id="edit-merchant"
                                  value={editFormData.merchant}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, merchant: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-amount">Amount</Label>
                                <Input
                                  id="edit-amount"
                                  type="number"
                                  step="0.01"
                                  value={editFormData.amount}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-category">Category</Label>
                                <Select 
                                  value={editFormData.category_id} 
                                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, category_id: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-date">Date</Label>
                                <Input
                                  id="edit-date"
                                  type="date"
                                  value={editFormData.date}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                  id="edit-description"
                                  value={editFormData.description}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-notes">Notes</Label>
                                <Textarea
                                  id="edit-notes"
                                  value={editFormData.notes}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" className="flex-1">Save Changes</Button>
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  onClick={() => setEditingTransaction(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No transactions found</p>
                <p className="text-sm">
                  {searchQuery || selectedCategory !== "all" 
                    ? "Try adjusting your filters" 
                    : "Upload your first receipt to get started"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

