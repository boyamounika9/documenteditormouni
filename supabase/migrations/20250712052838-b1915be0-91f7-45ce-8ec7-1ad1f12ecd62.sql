
-- Create the documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB DEFAULT '{"html": "<p>Start writing here...</p>"}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false
);

-- Create the document_collaborators table
CREATE TABLE public.document_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check document access
CREATE OR REPLACE FUNCTION public.user_has_document_access(doc_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- RLS Policies for documents table
CREATE POLICY "Users can view documents they own or collaborate on" 
  ON public.documents FOR SELECT 
  USING (
    created_by = auth.uid() OR 
    is_public = true OR
    public.user_has_document_access(id, auth.uid())
  );

CREATE POLICY "Users can create their own documents" 
  ON public.documents FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update documents they own or have edit access to" 
  ON public.documents FOR UPDATE 
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.document_collaborators 
      WHERE document_id = id AND user_id = auth.uid() AND permission IN ('edit', 'admin')
    )
  );

CREATE POLICY "Users can delete documents they own" 
  ON public.documents FOR DELETE 
  USING (created_by = auth.uid());

-- RLS Policies for document_collaborators table
CREATE POLICY "Users can view collaborators for their documents" 
  ON public.document_collaborators FOR SELECT 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Document owners can manage collaborators" 
  ON public.document_collaborators FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_documents_created_by ON public.documents(created_by);
CREATE INDEX idx_documents_updated_at ON public.documents(updated_at DESC);
CREATE INDEX idx_document_collaborators_document_id ON public.document_collaborators(document_id);
CREATE INDEX idx_document_collaborators_user_id ON public.document_collaborators(user_id);
