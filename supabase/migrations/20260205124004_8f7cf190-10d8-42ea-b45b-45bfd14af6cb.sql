-- Insert test sales orders using existing user
INSERT INTO public.sales_orders (id, order_number, customer_id, depot_id, sales_rep_id, status, total_amount, order_date, expected_delivery_date, notes)
VALUES
  ('44444444-4444-4444-4444-444444444401', 'ORD-20260201-0001', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'delivered', 168000.00, '2026-02-01', '2026-02-02', 'Urgent delivery required'),
  ('44444444-4444-4444-4444-444444444402', 'ORD-20260201-0002', '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222205', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'delivered', 97500.00, '2026-02-01', '2026-02-03', NULL),
  ('44444444-4444-4444-4444-444444444403', 'ORD-20260202-0003', '33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'dispatched', 325000.00, '2026-02-02', '2026-02-04', 'Regular weekly order'),
  ('44444444-4444-4444-4444-444444444404', 'ORD-20260202-0004', '33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222202', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'processing', 55500.00, '2026-02-02', '2026-02-05', 'For bakery supplies'),
  ('44444444-4444-4444-4444-444444444405', 'ORD-20260203-0005', '33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222204', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'confirmed', 195000.00, '2026-02-03', '2026-02-06', NULL),
  ('44444444-4444-4444-4444-444444444406', 'ORD-20260203-0006', '33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222206', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'pending', 84000.00, '2026-02-03', '2026-02-07', 'First order from this customer'),
  ('44444444-4444-4444-4444-444444444407', 'ORD-20260204-0007', '33333333-3333-3333-3333-333333333307', '22222222-2222-2222-2222-222222222201', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'pending', 487500.00, '2026-02-04', '2026-02-08', 'Large bulk order'),
  ('44444444-4444-4444-4444-444444444408', 'ORD-20260204-0008', '33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222203', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'confirmed', 201600.00, '2026-02-04', '2026-02-09', NULL),
  ('44444444-4444-4444-4444-444444444409', 'ORD-20260205-0009', '33333333-3333-3333-3333-333333333309', '22222222-2222-2222-2222-222222222205', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'processing', 357500.00, '2026-02-05', '2026-02-10', 'Monthly restock'),
  ('44444444-4444-4444-4444-444444444410', 'ORD-20260205-0010', '33333333-3333-3333-3333-333333333310', '22222222-2222-2222-2222-222222222204', '164ee980-1f5d-4795-bd81-dfc47e616ab1', 'pending', 422500.00, '2026-02-05', '2026-02-11', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert test order items (fixed)
INSERT INTO public.order_items (id, order_id, product_id, quantity, unit_price, total_price)
VALUES
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 30, 2800.00, 84000.00),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111102', 30, 2750.00, 82500.00),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111104', 15, 6500.00, 97500.00),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111104', 50, 6500.00, 325000.00),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111107', 30, 1850.00, 55500.00),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111105', 30, 3350.00, 100500.00),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111106', 25, 3600.00, 90000.00)
ON CONFLICT DO NOTHING;

-- Insert test shipments
INSERT INTO public.shipments (id, order_id, driver_name, driver_phone, driver_id_number, vehicle_number_plate, status, created_by, dispatched_at, delivered_at, notes)
VALUES
  ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', 'James Omondi', '+254733100001', '12345678', 'KBZ 123A', 'delivered', '164ee980-1f5d-4795-bd81-dfc47e616ab1', '2026-02-01 08:00:00+03', '2026-02-01 14:30:00+03', 'Delivered on time'),
  ('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444402', 'Peter Kimani', '+254733100002', '23456789', 'KCA 456B', 'delivered', '164ee980-1f5d-4795-bd81-dfc47e616ab1', '2026-02-02 07:30:00+03', '2026-02-02 16:00:00+03', NULL),
  ('55555555-5555-5555-5555-555555555503', '44444444-4444-4444-4444-444444444403', 'Daniel Wafula', '+254733100003', '34567890', 'KDB 789C', 'in_transit', '164ee980-1f5d-4795-bd81-dfc47e616ab1', '2026-02-04 06:00:00+03', NULL, 'Currently en route to Kisumu'),
  ('55555555-5555-5555-5555-555555555504', '44444444-4444-4444-4444-444444444404', 'Samuel Mwangi', '+254733100004', '45678901', 'KEC 012D', 'loading', '164ee980-1f5d-4795-bd81-dfc47e616ab1', NULL, NULL, 'Loading at Mombasa depot'),
  ('55555555-5555-5555-5555-555555555505', '44444444-4444-4444-4444-444444444405', 'Joseph Otieno', '+254733100005', '56789012', 'KFD 345E', 'pending', '164ee980-1f5d-4795-bd81-dfc47e616ab1', NULL, NULL, 'Scheduled for tomorrow')
ON CONFLICT (id) DO NOTHING;

-- Insert test delivery incidents
INSERT INTO public.delivery_incidents (id, shipment_id, incident_type, description, reported_by, reported_at, resolved_at, resolution_notes)
VALUES
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555501', 'customer_unavailable', 'Customer was not at the delivery location initially. Had to wait 45 minutes.', '164ee980-1f5d-4795-bd81-dfc47e616ab1', '2026-02-01 12:30:00+03', '2026-02-01 13:15:00+03', 'Customer arrived and accepted delivery. No further issues.'),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555502', 'vehicle_breakdown', 'Flat tire on the highway near Gilgil. Had to call for roadside assistance.', '164ee980-1f5d-4795-bd81-dfc47e616ab1', '2026-02-02 11:00:00+03', '2026-02-02 12:30:00+03', 'Tire replaced. Delivery completed with 1.5 hour delay.'),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555503', 'weather_delay', 'Heavy rain causing slow traffic on Nairobi-Kisumu highway.', '164ee980-1f5d-4795-bd81-dfc47e616ab1', '2026-02-04 10:00:00+03', NULL, NULL),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555503', 'wrong_address', 'GPS directed to wrong location. Customer provided updated directions.', '164ee980-1f5d-4795-bd81-dfc47e616ab1', '2026-02-04 14:30:00+03', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Insert test sales returns
INSERT INTO public.sales_returns (id, order_id, product_id, quantity, weight_kg, return_reason, status, notes, processed_by, return_date)
VALUES
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 5, 100.0, 'Damaged packaging during transit', 'approved', 'Bags torn, sugar exposed to moisture', '164ee980-1f5d-4795-bd81-dfc47e616ab1', '2026-02-02'),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111104', 2, 100.0, 'Wrong product delivered', 'pending', 'Customer ordered 25kg bags, received 50kg bags', NULL, '2026-02-03'),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111102', 3, 60.0, 'Quality issue - sugar discolored', 'rejected', 'Upon inspection, discoloration was within acceptable limits', '164ee980-1f5d-4795-bd81-dfc47e616ab1', '2026-02-04')
ON CONFLICT DO NOTHING;