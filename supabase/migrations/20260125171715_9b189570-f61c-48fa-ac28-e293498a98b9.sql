-- Create storage bucket for driver photos
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-photos', 'driver-photos', true);

-- Create policies for driver photos storage
CREATE POLICY "Authenticated users can upload driver photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-photos');

CREATE POLICY "Driver photos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'driver-photos');

CREATE POLICY "Authenticated users can update driver photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-photos');

CREATE POLICY "Authenticated users can delete driver photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-photos');

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_orders;