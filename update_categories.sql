UPDATE categories 
SET keywords = ARRAY['walmart', 'wal-mart', 'wal mart', 'supercenter', 'grocery', 'supermarket', 'target', 'costco', 'sams club', 'whole foods', 'trader joes', 'trader joe', 'safeway', 'kroger', 'publix', 'albertsons', 'food lion', 'wegmans', 'aldi', 'lidl', 'market', 'food store', 'groceries']
WHERE name = 'Groceries';

UPDATE categories 
SET keywords = ARRAY['restaurant', 'food', 'cafe', 'coffee', 'starbucks', 'dunkin', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'mcdonalds', 'wendys', 'subway', 'chipotle', 'panera', 'chick-fil-a', 'taco bell', 'kfc', 'dominos', 'papa johns', 'sushi', 'takeout', 'delivery', 'uber eats', 'doordash', 'grubhub', 'postmates', 'dine', 'bistro', 'grill', 'bar', 'pub']
WHERE name = 'Food & Dining';

UPDATE categories 
SET keywords = ARRAY['amazon', 'ebay', 'shopping', 'retail', 'store', 'mall', 'best buy', 'apple store', 'macys', 'nordstrom', 'kohls', 'jcpenney', 'dillards', 'sephora', 'ulta', 'clothes', 'clothing', 'apparel', 'fashion', 'shoes', 'electronics', 'gap', 'old navy', 'h&m', 'zara', 'uniqlo', 'forever 21', 'nike', 'adidas']
WHERE name = 'Shopping';
