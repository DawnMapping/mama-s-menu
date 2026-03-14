INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true);

CREATE POLICY "Anyone can read recipe images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'recipe-images');
CREATE POLICY "Service can insert recipe images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'recipe-images');