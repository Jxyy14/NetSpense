-- Create categories table for expense categorization
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  color text,
  keywords text[], -- Keywords for NLP categorization
  created_at timestamp with time zone DEFAULT now()
);

-- Create transactions table for all expenses
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  description text,
  merchant text,
  category_id uuid REFERENCES categories(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  raw_ocr_text text,
  is_recurring boolean DEFAULT false,
  tags text[],
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create budgets table for budget tracking
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  amount numeric(10, 2) NOT NULL,
  period text NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user_settings table for preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  currency text DEFAULT 'USD',
  budget_alert_threshold numeric(3, 2) DEFAULT 0.80, -- Alert at 80% of budget
  theme text DEFAULT 'system',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default categories with keywords for NLP classification
INSERT INTO categories (name, icon, color, keywords) VALUES
  ('Food & Dining', '🍔', '#ef4444', ARRAY['restaurant', 'food', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'sushi', 'takeout', 'delivery', 'uber eats', 'doordash', 'grubhub']),
  ('Transportation', '🚗', '#3b82f6', ARRAY['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking', 'metro', 'bus', 'train', 'transit', 'car', 'vehicle', 'transportation']),
  ('Utilities', '💡', '#f59e0b', ARRAY['electric', 'electricity', 'water', 'gas', 'internet', 'phone', 'utility', 'bill', 'energy', 'power', 'cable', 'wifi']),
  ('Groceries', '🛒', '#10b981', ARRAY['grocery', 'supermarket', 'walmart', 'target', 'costco', 'whole foods', 'trader joe', 'safeway', 'kroger', 'market', 'food store']),
  ('Entertainment', '🎬', '#8b5cf6', ARRAY['movie', 'cinema', 'netflix', 'spotify', 'hulu', 'disney', 'gaming', 'game', 'concert', 'theater', 'entertainment', 'streaming']),
  ('Shopping', '🛍️', '#ec4899', ARRAY['amazon', 'shopping', 'retail', 'store', 'clothes', 'clothing', 'apparel', 'fashion', 'shoes', 'electronics']),
  ('Healthcare', '⚕️', '#06b6d4', ARRAY['pharmacy', 'hospital', 'doctor', 'medical', 'health', 'medicine', 'clinic', 'dental', 'healthcare', 'cvs', 'walgreens']),
  ('Education', '📚', '#6366f1', ARRAY['school', 'university', 'college', 'course', 'book', 'education', 'tuition', 'learning', 'training']),
  ('Home & Living', '🏠', '#84cc16', ARRAY['furniture', 'home', 'decor', 'ikea', 'home depot', 'lowes', 'rent', 'mortgage', 'household']),
  ('Personal Care', '💆', '#f97316', ARRAY['salon', 'spa', 'haircut', 'beauty', 'cosmetics', 'gym', 'fitness', 'personal care']),
  ('Travel', '✈️', '#0ea5e9', ARRAY['hotel', 'airbnb', 'flight', 'airline', 'travel', 'vacation', 'booking', 'expedia', 'trip']),
  ('Discretionary', '🎯', '#64748b', ARRAY['misc', 'other', 'miscellaneous', 'various', 'general']);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for budgets
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Everyone can view categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT DO NOTHING;

-- Storage policies for receipts
CREATE POLICY "Users can upload their own receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

