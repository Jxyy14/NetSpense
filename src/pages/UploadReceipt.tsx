import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { extractTextFromImage, parseReceiptText } from "@/lib/ocr";
import { categorizeTransaction } from "@/lib/categorization";
import { getDemoUserId } from "@/lib/mock-user";
import { Upload, Camera, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export default function UploadReceipt() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [ocrText, setOcrText] = useState("");
  const [formData, setFormData] = useState({
    merchant: "",
    amount: "",
    description: "",
    category_id: "",
    date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
    } else {
      setCategories(data || []);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  async function processReceipt() {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a receipt image first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setOcrProgress(10);

      // Extract text using OCR
      toast({
        title: "Processing receipt",
        description: "Extracting text from your receipt...",
      });

      setOcrProgress(30);
      const ocrResult = await extractTextFromImage(selectedFile);
      setOcrText(ocrResult.text);
      setOcrProgress(60);

      // Parse receipt data
      const parsed = parseReceiptText(ocrResult.text);
      
      setOcrProgress(80);

      // Auto-categorize
      const suggestedCategory = categorizeTransaction(
        parsed.merchant || "",
        ocrResult.text,
        categories
      );

      // Update form with extracted data
      setFormData(prev => ({
        ...prev,
        merchant: parsed.merchant || prev.merchant,
        amount: parsed.total?.toFixed(2) || prev.amount,
        description: parsed.items?.slice(0, 2).join(", ") || prev.description,
        category_id: suggestedCategory?.id || prev.category_id,
        date: parsed.date ? parsed.date.toISOString().split('T')[0] : prev.date,
      }));

      setOcrProgress(100);

      toast({
        title: "Receipt processed!",
        description: `Extracted with ${Math.round(ocrResult.confidence)}% confidence`,
      });

    } catch (error: any) {
      console.error('OCR Error:', error);
      toast({
        title: "Processing failed",
        description: "Could not extract text from receipt. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.amount || !formData.category_id) {
      toast({
        title: "Missing information",
        description: "Please fill in amount and category",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const userId = getDemoUserId();

      let receiptUrl = null;

      // Upload receipt image if available
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);
          receiptUrl = publicUrl;
        }
      }

      // Insert transaction
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          merchant: formData.merchant,
          amount: parseFloat(formData.amount),
          description: formData.description,
          category_id: formData.category_id,
          date: formData.date,
          notes: formData.notes,
          receipt_url: receiptUrl,
          raw_ocr_text: ocrText || null,
        });

      if (insertError) throw insertError;

      toast({
        title: "Transaction added!",
        description: "Your expense has been recorded successfully",
      });

      // Reset form and navigate
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error saving transaction",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Upload Receipt</h1>
        <p className="text-muted-foreground">
          Scan your receipt or enter transaction details manually
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Receipt Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Receipt Image
            </CardTitle>
            <CardDescription>
              Upload a photo of your receipt for automatic extraction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="receipt-upload"
                disabled={loading}
              />
              <label htmlFor="receipt-upload" className="cursor-pointer">
                {previewUrl ? (
                  <div className="space-y-2">
                    <img 
                      src={previewUrl} 
                      alt="Receipt preview" 
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      Click to change image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG up to 10MB
                    </div>
                  </div>
                )}
              </label>
            </div>

            {selectedFile && !ocrText && (
              <Button 
                onClick={processReceipt} 
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract Text with AI
                  </>
                )}
              </Button>
            )}

            {loading && (
              <div className="space-y-2">
                <Progress value={ocrProgress} />
                <p className="text-xs text-center text-muted-foreground">
                  {ocrProgress < 50 ? 'Scanning receipt...' : 
                   ocrProgress < 80 ? 'Extracting information...' : 
                   'Categorizing...'}
                </p>
              </div>
            )}

            {ocrText && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Text extracted successfully! Review and edit the details below.
                </AlertDescription>
              </Alert>
            )}

            {ocrText && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-2">Extracted Text:</p>
                <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {ocrText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Review and confirm the transaction information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant / Store</Label>
                <Input
                  id="merchant"
                  placeholder="e.g. Whole Foods, Amazon"
                  value={formData.merchant}
                  onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
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
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category">
                      {selectedCategory && (
                        <span className="flex items-center gap-2">
                          <span>{selectedCategory.icon}</span>
                          <span>{selectedCategory.name}</span>
                        </span>
                      )}
                    </SelectValue>
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
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Weekly groceries"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Transaction'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

