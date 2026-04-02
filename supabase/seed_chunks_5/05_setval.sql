-- Reset identity sequences to current max IDs
BEGIN;

SELECT setval(pg_get_serial_sequence('public.customers', 'customer_id'), COALESCE((SELECT MAX(customer_id) FROM public.customers), 1), true);
SELECT setval(pg_get_serial_sequence('public.products', 'product_id'), COALESCE((SELECT MAX(product_id) FROM public.products), 1), true);
SELECT setval(pg_get_serial_sequence('public.orders', 'order_id'), COALESCE((SELECT MAX(order_id) FROM public.orders), 1), true);
SELECT setval(pg_get_serial_sequence('public.product_reviews', 'review_id'), COALESCE((SELECT MAX(review_id) FROM public.product_reviews), 1), true);
SELECT setval(pg_get_serial_sequence('public.order_items', 'order_item_id'), COALESCE((SELECT MAX(order_item_id) FROM public.order_items), 1), true);
SELECT setval(pg_get_serial_sequence('public.shipments', 'shipment_id'), COALESCE((SELECT MAX(shipment_id) FROM public.shipments), 1), true);

COMMIT;
