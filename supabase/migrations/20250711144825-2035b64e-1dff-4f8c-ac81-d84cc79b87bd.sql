-- this project in supabase acount
-- Create documents table for storing document content and metadata
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  is_public BOOLEAN DEFAULT false
);

-- Create document_collaborators table for managing sharing permissions
CREATE TABLE public.document_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- Create document_versions table for version history
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  content JSONB NOT NULL,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view documents they own or collaborate on" 
  ON public.documents FOR SELECT 
  USING (
    created_by = auth.uid() OR 
    is_public = true OR
    EXISTS (
      SELECT 1 FROM public.document_collaborators 
      WHERE document_id = documents.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own documents" 
  ON public.documents FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update documents they own or have edit access to" 
  ON public.documents FOR UPDATE 
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.document_collaborators 
      WHERE document_id = documents.id AND user_id = auth.uid() AND permission IN ('edit', 'admin')
    )
  );

CREATE POLICY "Users can delete their own documents" 
  ON public.documents FOR DELETE 
  USING (created_by = auth.uid());

-- RLS Policies for document_collaborators
CREATE POLICY "Users can view collaborators for documents they have access to" 
  ON public.document_collaborators FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND (
        created_by = auth.uid() OR 
        is_public = true OR
        EXISTS (
          SELECT 1 FROM public.document_collaborators dc2 
          WHERE dc2.document_id = documents.id AND dc2.user_id = auth.uid()
        )
      )
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

-- RLS Policies for document_versions
CREATE POLICY "Users can view versions for accessible documents" 
  ON public.document_versions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND (
        created_by = auth.uid() OR 
        is_public = true OR
        EXISTS (
          SELECT 1 FROM public.document_collaborators 
          WHERE document_id = documents.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create versions for documents they can edit" 
  ON public.document_versions FOR INSERT 
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND (
        created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.document_collaborators 
          WHERE document_id = documents.id AND user_id = auth.uid() AND permission IN ('edit', 'admin')
        )
      )
    )
  );

-- Enable realtime for real-time collaboration
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.document_collaborators REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_collaborators;

-- Create function to automatically create document versions
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO public.document_versions (document_id, content, version_number, created_by)
    VALUES (
      NEW.id, 
      OLD.content, 
      COALESCE((
        SELECT MAX(version_number) + 1 
        FROM public.document_versions 
        WHERE document_id = NEW.id
      ), 1),
      auth.uid()
    );
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic version creation
CREATE TRIGGER create_document_version_trigger
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();
