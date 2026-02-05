-- Insert test products (sugar variants)
INSERT INTO public.products (id, name, sku, sugar_type, unit_price, unit_of_measure, min_stock_level, description, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Kabras Sugar Bale 2x10kg', 'KS-BALE-2X10', 'bale_2x10', 2800.00, 'bale', 50, 'Premium white sugar in 2x10kg bale packaging', true),
  ('11111111-1111-1111-1111-111111111102', 'Kabras Sugar Bale 1x20kg', 'KS-BALE-1X20', 'bale_1x20', 2750.00, 'bale', 50, 'Premium white sugar in 1x20kg bale packaging', true),
  ('11111111-1111-1111-1111-111111111103', 'Kabras Sugar Bale 1x12kg', 'KS-BALE-1X12', 'bale_1x12', 1680.00, 'bale', 75, 'Premium white sugar in 1x12kg bale packaging', true),
  ('11111111-1111-1111-1111-111111111104', 'Kabras Sugar Bag 50kg', 'KS-BAG-50', 'bag_50kg', 6500.00, 'bag', 100, 'Industrial white sugar in 50kg bags', true),
  ('11111111-1111-1111-1111-111111111105', 'Kabras Sugar Bag 25kg', 'KS-BAG-25', 'bag_25kg', 3350.00, 'bag', 150, 'Commercial white sugar in 25kg bags', true),
  ('11111111-1111-1111-1111-111111111106', 'Kabras Brown Sugar 25kg', 'KS-BROWN-25', 'bag_25kg', 3600.00, 'bag', 100, 'Premium brown sugar in 25kg bags', true),
  ('11111111-1111-1111-1111-111111111107', 'Kabras Icing Sugar 10kg', 'KS-ICING-10', NULL, 1850.00, 'bag', 60, 'Fine icing sugar for bakeries', true)
ON CONFLICT (id) DO NOTHING;

-- Insert test depots
INSERT INTO public.depots (id, name, location, contact_phone, is_active)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'Nairobi Central Depot', 'Industrial Area, Nairobi', '+254712345001', true),
  ('22222222-2222-2222-2222-222222222202', 'Mombasa Depot', 'Changamwe, Mombasa', '+254712345002', true),
  ('22222222-2222-2222-2222-222222222203', 'Kisumu Depot', 'Kondele, Kisumu', '+254712345003', true),
  ('22222222-2222-2222-2222-222222222204', 'Eldoret Depot', 'Kapseret, Eldoret', '+254712345004', true),
  ('22222222-2222-2222-2222-222222222205', 'Nakuru Depot', 'Industrial Area, Nakuru', '+254712345005', true),
  ('22222222-2222-2222-2222-222222222206', 'Thika Depot', 'Makongeni, Thika', '+254712345006', true)
ON CONFLICT (id) DO NOTHING;

-- Insert test customers
INSERT INTO public.customers (id, name, company_name, phone, email, address, credit_limit, is_active)
VALUES
  ('33333333-3333-3333-3333-333333333301', 'John Kamau', 'Kamau Wholesalers Ltd', '+254722100001', 'john@kamauwholesalers.co.ke', '123 Moi Avenue, Nairobi', 500000.00, true),
  ('33333333-3333-3333-3333-333333333302', 'Mary Wanjiku', 'Wanjiku Supermarket', '+254722100002', 'mary@wanjikusupermarket.co.ke', '45 Kenyatta Street, Nakuru', 350000.00, true),
  ('33333333-3333-3333-3333-333333333303', 'Peter Odhiambo', 'Odhiambo Traders', '+254722100003', 'peter@odhiambotraders.co.ke', '78 Oginga Odinga Road, Kisumu', 450000.00, true),
  ('33333333-3333-3333-3333-333333333304', 'Grace Muthoni', 'Muthoni Bakeries', '+254722100004', 'grace@muthonibakeries.co.ke', '12 Haile Selassie Avenue, Mombasa', 280000.00, true),
  ('33333333-3333-3333-3333-333333333305', 'David Kiprop', 'Kiprop General Stores', '+254722100005', 'david@kipropstores.co.ke', '34 Uganda Road, Eldoret', 320000.00, true),
  ('33333333-3333-3333-3333-333333333306', 'Sarah Njeri', 'Njeri Mini Mart', '+254722100006', 'sarah@njeriminimart.co.ke', '56 Kimathi Street, Thika', 180000.00, true),
  ('33333333-3333-3333-3333-333333333307', 'Michael Otieno', 'Otieno Distributors', '+254722100007', 'michael@otienodist.co.ke', '89 Tom Mboya Street, Nairobi', 750000.00, true),
  ('33333333-3333-3333-3333-333333333308', 'Lucy Akinyi', 'Akinyi Wholesale Center', '+254722100008', 'lucy@akinyiwholesale.co.ke', '23 Luthuli Avenue, Kisumu', 420000.00, true),
  ('33333333-3333-3333-3333-333333333309', 'James Mwangi', 'Mwangi Cash & Carry', '+254722100009', 'james@mwangicash.co.ke', '67 Biashara Street, Nakuru', 580000.00, true),
  ('33333333-3333-3333-3333-333333333310', 'Rose Cherono', 'Cherono Foods Ltd', '+254722100010', 'rose@cheronofoods.co.ke', '90 Nandi Road, Eldoret', 650000.00, true),
  ('33333333-3333-3333-3333-333333333311', 'Samuel Mutua', 'Mutua Enterprises', '+254722100011', 'samuel@mutuaent.co.ke', '15 Moi Road, Mombasa', 390000.00, true),
  ('33333333-3333-3333-3333-333333333312', 'Faith Wairimu', 'Wairimu Superstore', '+254722100012', 'faith@wairimustore.co.ke', '48 Kenyatta Highway, Thika', 270000.00, true)
ON CONFLICT (id) DO NOTHING;

-- Insert test inventory for each depot-product combination
INSERT INTO public.inventory (id, depot_id, product_id, quantity)
SELECT 
  gen_random_uuid(),
  d.id,
  p.id,
  FLOOR(RANDOM() * 500 + 50)::integer
FROM public.depots d
CROSS JOIN public.products p
WHERE d.id IN (
  '22222222-2222-2222-2222-222222222201',
  '22222222-2222-2222-2222-222222222202',
  '22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222205',
  '22222222-2222-2222-2222-222222222206'
)
AND p.id IN (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103',
  '11111111-1111-1111-1111-111111111104',
  '11111111-1111-1111-1111-111111111105',
  '11111111-1111-1111-1111-111111111106',
  '11111111-1111-1111-1111-111111111107'
)
ON CONFLICT DO NOTHING;