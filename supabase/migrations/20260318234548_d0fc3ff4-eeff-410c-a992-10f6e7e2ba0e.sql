CREATE POLICY "Anyone can update recipe images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Anyone can delete recipe images"
ON storage.objects FOR DELETE
USING (bucket_id = 'recipe-images');