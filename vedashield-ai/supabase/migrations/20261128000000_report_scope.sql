-- Apply only after reviewing existing records and testing in staging.
DROP POLICY IF EXISTS "Users can manage reports belonging to their profiles" ON public.reports;
CREATE POLICY "Users can manage reports belonging to their profiles" ON public.reports FOR ALL TO authenticated
USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));
ALTER TABLE public.reports ALTER COLUMN verified SET DEFAULT false;
DROP POLICY IF EXISTS "Authenticated users can upload records" ON storage.objects;
CREATE POLICY "Authenticated users can upload records" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-records' AND (storage.foldername(name))[1] = auth.uid()::text);
