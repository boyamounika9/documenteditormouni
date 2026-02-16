-- this project in supabase acount
-- First, drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Users can view collaborators for documents they have access to" ON public.document_collaborators;

-- Create a simpler, non-recursive policy for viewing collaborators
CREATE POLICY "Users can view collaborators for their documents" 
  ON public.document_collaborators FOR SELECT 
  USING (
    -- Users can see collaborators for documents they own
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND created_by = auth.uid()
    ) OR
    -- Users can see collaborators for documents they are collaborators on
    user_id = auth.uid()
  );

-- Also fix the document policy to avoid referencing document_collaborators recursively
DROP POLICY IF EXISTS "Users can view documents they own or collaborate on" ON public.documents;

CREATE POLICY "Users can view documents they own or collaborate on" 
  ON public.documents FOR SELECT 
  USING (
    created_by = auth.uid() OR 
    is_public = true OR
    id IN (
      SELECT document_id FROM public.document_collaborators 
      WHERE user_id = auth.uid()
    )
  );

-- Fix the update policy for documents to avoid recursion
DROP POLICY IF EXISTS "Users can update documents they own or have edit access to" ON public.documents;

CREATE POLICY "Users can update documents they own or have edit access to" 
  ON public.documents FOR UPDATE 
  USING (
    created_by = auth.uid() OR 
    id IN (
      SELECT document_id FROM public.document_collaborators 
      WHERE user_id = auth.uid() AND permission IN ('edit', 'admin')
    )
  );
