<<<<<<< HEAD
-- this project in supabase acount
=======

>>>>>>> 5f2fe600e7da0dc87d5982636b453210ffce3e73
-- Create a security definer function to check if user has access to a document
-- This prevents recursion by executing with elevated privileges
CREATE OR REPLACE FUNCTION public.user_has_document_access(doc_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = doc_id AND created_by = user_id
  ) OR EXISTS (
    SELECT 1 FROM public.document_collaborators 
    WHERE document_id = doc_id AND user_id = user_has_document_access.user_id
  );
$$;

-- Drop and recreate the documents SELECT policy using the security definer function
DROP POLICY IF EXISTS "Users can view documents they own or collaborate on" ON public.documents;

CREATE POLICY "Users can view documents they own or collaborate on" 
  ON public.documents FOR SELECT 
  USING (
    created_by = auth.uid() OR 
    is_public = true OR
    public.user_has_document_access(id, auth.uid())
  );

-- Also update the UPDATE policy to use the same approach
DROP POLICY IF EXISTS "Users can update documents they own or have edit access to" ON public.documents;

CREATE POLICY "Users can update documents they own or have edit access to" 
  ON public.documents FOR UPDATE 
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.document_collaborators 
      WHERE document_id = id AND user_id = auth.uid() AND permission IN ('edit', 'admin')
    )
  );

-- Ensure the document_collaborators policy is also non-recursive
DROP POLICY IF EXISTS "Users can view collaborators for their documents" ON public.document_collaborators;

CREATE POLICY "Users can view collaborators for their documents" 
  ON public.document_collaborators FOR SELECT 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND created_by = auth.uid()
    )
  );
