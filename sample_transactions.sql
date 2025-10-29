-- Sample transactions to populate the dashboard with demo data
-- Replace '00000000-0000-0000-0000-000000000000' with your actual demo user ID if different

-- Get category IDs first
DO $$
DECLARE
    v_user_id uuid := '00000000-0000-0000-0000-000000000000';
    v_food_id uuid;
    v_groceries_id uuid;
    v_transport_id uuid;
    v_shopping_id uuid;
    v_entertainment_id uuid;
    v_utilities_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO v_food_id FROM categories WHERE name = 'Food & Dining' LIMIT 1;
    SELECT id INTO v_groceries_id FROM categories WHERE name = 'Groceries' LIMIT 1;
    SELECT id INTO v_transport_id FROM categories WHERE name = 'Transportation' LIMIT 1;
    SELECT id INTO v_shopping_id FROM categories WHERE name = 'Shopping' LIMIT 1;
    SELECT id INTO v_entertainment_id FROM categories WHERE name = 'Entertainment' LIMIT 1;
    SELECT id INTO v_utilities_id FROM categories WHERE name = 'Utilities' LIMIT 1;

    -- Insert sample transactions for the past 3 months
    
    -- October 2025
    INSERT INTO transactions (user_id, amount, merchant, description, category_id, date, created_at) VALUES
    (v_user_id, 45.32, 'Starbucks', 'Coffee and breakfast', v_food_id, '2025-10-28', NOW()),
    (v_user_id, 127.45, 'Whole Foods', 'Weekly groceries', v_groceries_id, '2025-10-27', NOW()),
    (v_user_id, 89.99, 'Shell Gas Station', 'Gas fill-up', v_transport_id, '2025-10-26', NOW()),
    (v_user_id, 234.50, 'Target', 'Household items', v_shopping_id, '2025-10-25', NOW()),
    (v_user_id, 15.99, 'Netflix', 'Monthly subscription', v_entertainment_id, '2025-10-24', NOW()),
    (v_user_id, 156.78, 'Walmart', 'Groceries and supplies', v_groceries_id, '2025-10-23', NOW()),
    (v_user_id, 32.50, 'Chipotle', 'Lunch', v_food_id, '2025-10-22', NOW()),
    (v_user_id, 145.00, 'Electric Company', 'Monthly electricity bill', v_utilities_id, '2025-10-21', NOW()),
    (v_user_id, 67.89, 'Amazon', 'Electronics', v_shopping_id, '2025-10-20', NOW()),
    (v_user_id, 28.45, 'Subway', 'Dinner', v_food_id, '2025-10-19', NOW()),
    (v_user_id, 95.32, 'Costco', 'Bulk groceries', v_groceries_id, '2025-10-18', NOW()),
    (v_user_id, 42.00, 'Uber', 'Ride to airport', v_transport_id, '2025-10-17', NOW()),
    (v_user_id, 189.99, 'Best Buy', 'New headphones', v_shopping_id, '2025-10-16', NOW()),
    (v_user_id, 25.75, 'McDonald''s', 'Fast food', v_food_id, '2025-10-15', NOW()),
    (v_user_id, 312.45, 'Safeway', 'Monthly grocery run', v_groceries_id, '2025-10-14', NOW()),
    (v_user_id, 55.00, 'Gas Station', 'Fuel', v_transport_id, '2025-10-13', NOW()),
    (v_user_id, 78.99, 'Spotify', 'Annual premium', v_entertainment_id, '2025-10-12', NOW()),
    (v_user_id, 125.00, 'Internet Provider', 'Monthly internet', v_utilities_id, '2025-10-11', NOW()),
    (v_user_id, 45.60, 'Panera Bread', 'Lunch meeting', v_food_id, '2025-10-10', NOW()),
    (v_user_id, 198.75, 'Trader Joe''s', 'Specialty groceries', v_groceries_id, '2025-10-09', NOW()),
    
    -- September 2025
    (v_user_id, 52.30, 'Starbucks', 'Morning coffee runs', v_food_id, '2025-09-28', NOW()),
    (v_user_id, 145.67, 'Walmart', 'Weekly shopping', v_groceries_id, '2025-09-25', NOW()),
    (v_user_id, 75.00, 'Shell', 'Gas', v_transport_id, '2025-09-23', NOW()),
    (v_user_id, 89.99, 'Amazon', 'Books', v_shopping_id, '2025-09-20', NOW()),
    (v_user_id, 38.50, 'Chipotle', 'Dinner', v_food_id, '2025-09-18', NOW()),
    (v_user_id, 156.89, 'Whole Foods', 'Organic groceries', v_groceries_id, '2025-09-15', NOW()),
    (v_user_id, 145.00, 'Electric Company', 'Electricity', v_utilities_id, '2025-09-12', NOW()),
    (v_user_id, 45.00, 'Uber', 'Transportation', v_transport_id, '2025-09-10', NOW()),
    (v_user_id, 125.00, 'Internet Provider', 'Internet', v_utilities_id, '2025-09-08', NOW()),
    (v_user_id, 234.56, 'Costco', 'Bulk shopping', v_groceries_id, '2025-09-05', NOW()),
    (v_user_id, 67.89, 'Best Buy', 'Tech accessories', v_shopping_id, '2025-09-03', NOW()),
    (v_user_id, 15.99, 'Netflix', 'Streaming', v_entertainment_id, '2025-09-01', NOW()),
    
    -- August 2025
    (v_user_id, 156.78, 'Walmart', 'Monthly groceries', v_groceries_id, '2025-08-28', NOW()),
    (v_user_id, 42.50, 'Starbucks', 'Coffee', v_food_id, '2025-08-25', NOW()),
    (v_user_id, 85.00, 'Gas Station', 'Fuel', v_transport_id, '2025-08-22', NOW()),
    (v_user_id, 198.99, 'Target', 'Home goods', v_shopping_id, '2025-08-20', NOW()),
    (v_user_id, 125.00, 'Internet Provider', 'Internet', v_utilities_id, '2025-08-18', NOW()),
    (v_user_id, 145.00, 'Electric Company', 'Electricity', v_utilities_id, '2025-08-15', NOW()),
    (v_user_id, 67.45, 'Subway', 'Lunch', v_food_id, '2025-08-12', NOW()),
    (v_user_id, 289.34, 'Whole Foods', 'Groceries', v_groceries_id, '2025-08-10', NOW()),
    (v_user_id, 45.00, 'Uber', 'Ride', v_transport_id, '2025-08-08', NOW()),
    (v_user_id, 15.99, 'Netflix', 'Subscription', v_entertainment_id, '2025-08-05', NOW()),
    (v_user_id, 178.90, 'Amazon', 'Various items', v_shopping_id, '2025-08-03', NOW()),
    (v_user_id, 95.67, 'Costco', 'Bulk items', v_groceries_id, '2025-08-01', NOW());

    RAISE NOTICE 'Sample transactions inserted successfully!';
END $$;

