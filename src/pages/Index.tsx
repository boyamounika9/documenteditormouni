
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ModernDocumentDashboard from '../components/ModernDocumentDashboard';
import ModernEditor from '../components/ModernEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Share2, Users, Settings } from 'lucide-react';
import ThemeSwitcher from '../components/ThemeSwitcher';

export interface Document {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_public: boolean;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session?.user?.email);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    console.log('Signing out...');
    await supabase.auth.signOut();
    setCurrentDocument(null);
    setDocumentTitle('');
  };

  const handleDocumentSelect = (document: Document) => {
    console.log('Selecting document:', document.title);
    setCurrentDocument(document);
    setDocumentTitle(document.title);
  };

  const handleBackToDashboard = () => {
    console.log('Going back to dashboard');
    setCurrentDocument(null);
    setDocumentTitle('');
  };

  const handleTitleChange = async (newTitle: string) => {
    setDocumentTitle(newTitle);
    
    if (currentDocument && newTitle !== currentDocument.title) {
      try {
        console.log('Updating document title:', newTitle);
        
        const { error } = await supabase
          .from('documents')
          .update({ 
            title: newTitle,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentDocument.id);

        if (error) {
          console.error('Error updating title:', error);
          throw error;
        }

        // Update the current document state
        setCurrentDocument({
          ...currentDocument,
          title: newTitle
        });

        toast({
          title: "Success",
          description: "Document title updated",
        });
      } catch (error: any) {
        console.error('Error updating title:', error);
        toast({
          title: "Error",
          description: "Failed to update document title: " + (error.message || 'Unknown error'),
          variant: "destructive",
        });
      }
    }
  };

  const handleContentChange = (content: string) => {
    // Content updates are handled by the ModernEditor component
    console.log('Content changed, length:', content.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
        {!currentDocument ? (
          <ModernDocumentDashboard
            user={user}
            onDocumentSelect={handleDocumentSelect}
            onSignOut={handleSignOut}
          />
        ) : (
          <div className="h-screen flex flex-col">
            {/* Document Header */}
            <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToDashboard}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <div className="flex-1 max-w-md">
                    <Input
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      onBlur={() => handleTitleChange(documentTitle)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0 bg-transparent"
                      placeholder="Untitled Document"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ThemeSwitcher />
                  
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Collaborators
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <ModernEditor
                documentId={currentDocument.id}
                initialTitle={documentTitle}
                initialContent={currentDocument.content?.html || '<p>Start writing here...</p>'}
                onTitleChange={handleTitleChange}
                onContentChange={handleContentChange}
              />
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};

export default Index;
