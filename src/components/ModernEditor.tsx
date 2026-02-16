
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import EditorToolbar from './EditorToolbar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Save, Clock, Users } from 'lucide-react';

interface ModernEditorProps {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  isReadOnly?: boolean;
}

const ModernEditor: React.FC<ModernEditorProps> = ({
  documentId,
  initialTitle,
  initialContent,
  onTitleChange,
  onContentChange,
  isReadOnly = false
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
    ],
    content: initialContent,
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange(html);
      
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // Set new timeout for auto-save
      const newTimeout = setTimeout(() => {
        handleAutoSave(html);
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      setSaveTimeout(newTimeout);
    },
  });

  const handleAutoSave = async (content: string) => {
    if (!documentId || isReadOnly) return;

    setIsSaving(true);
    try {
      console.log('Auto-saving document:', documentId);
      
      const { error } = await supabase
        .from('documents')
        .update({ 
          content: { html: content },
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('Auto-save error:', error);
        throw error;
      }
      
      setLastSaved(new Date());
      console.log('Auto-save successful');
    } catch (error: any) {
      console.error('Auto-save error:', error);
      toast({
        title: "Auto-save Error",
        description: "Failed to auto-save changes: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (!editor || !documentId) return;

    setIsSaving(true);
    try {
      const content = editor.getHTML();
      console.log('Manual save for document:', documentId);
      
      const { error } = await supabase
        .from('documents')
        .update({ 
          content: { html: content },
          title: initialTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('Manual save error:', error);
        throw error;
      }
      
      setLastSaved(new Date());
      toast({
        title: "Success",
        description: "Document saved successfully",
      });
    } catch (error: any) {
      console.error('Manual save error:', error);
      toast({
        title: "Save Error",
        description: "Failed to save document: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Set up real-time collaboration
  useEffect(() => {
    if (!documentId) return;

    console.log('Setting up real-time collaboration for document:', documentId);

    const channel = supabase
      .channel(`document:${documentId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
        filter: `id=eq.${documentId}`
      }, (payload) => {
        console.log('Real-time update received:', payload);
        
        if (payload.new && payload.new.content?.html && editor) {
          const currentContent = editor.getHTML();
          const newContent = payload.new.content.html;
          
          // Only update if content is different to avoid cursor jumping
          if (currentContent !== newContent) {
            console.log('Updating editor content from real-time update');
            editor.commands.setContent(newContent);
          }
        }
      })
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [documentId, editor]);

  // Load collaborators
  useEffect(() => {
    if (!documentId) return;

    const loadCollaborators = async () => {
      try {
        const { data, error } = await supabase
          .from('document_collaborators')
          .select('*')
          .eq('document_id', documentId);

        if (error) {
          console.error('Error loading collaborators:', error);
          return;
        }

        console.log('Loaded collaborators:', data);
        setCollaborators(data || []);
      } catch (error) {
        console.error('Error loading collaborators:', error);
      }
    };

    loadCollaborators();
  }, [documentId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      <EditorToolbar editor={editor} />
      
      {/* Save Status Bar */}
      <div className="border-b border-border bg-muted/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          {lastSaved && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              Auto-saving...
            </div>
          )}
        </div>
        
        {collaborators.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <EditorContent 
            editor={editor}
            className="prose prose-lg max-w-none dark:prose-invert focus:outline-none min-h-96"
          />
        </div>
      </div>
    </div>
  );
};

export default ModernEditor;
