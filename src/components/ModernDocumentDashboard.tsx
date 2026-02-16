
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, FileText, Clock, Users, MoreVertical, Trash2, Share } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AuthModal from './AuthModal';
import ThemeSwitcher from './ThemeSwitcher';

interface Document {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_public: boolean;
}

interface ModernDocumentDashboardProps {
  user: any;
  onDocumentSelect: (document: Document) => void;
  onSignOut: () => void;
}

const ModernDocumentDashboard: React.FC<ModernDocumentDashboardProps> = ({
  user,
  onDocumentSelect,
  onSignOut
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        throw error;
      }

      console.log('Loaded documents:', data);
      setDocuments(data || []);
      setFilteredDocuments(data || []);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  useEffect(() => {
    const filtered = documents.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDocuments(filtered);
  }, [documents, searchQuery]);

  const handleCreateDocument = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setCreating(true);
    try {
      console.log('Creating document for user:', user.id);
      
      const newDocument = {
        title: 'Untitled Document',
        content: { html: '<p>Start writing here...</p>' },
        created_by: user.id,
        is_public: false
      };

      console.log('Document data to insert:', newDocument);

      const { data, error } = await supabase
        .from('documents')
        .insert(newDocument)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Document created successfully:', data);

      toast({
        title: "Success",
        description: "Document created successfully!",
      });

      // Refresh the documents list
      await loadDocuments();
      
      // Open the new document
      onDocumentSelect(data);
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast({
        title: "Error", 
        description: "Failed to create document: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              DocuFlow
            </h1>
            <p className="text-lg text-muted-foreground">
              Collaborative Document Editor
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-muted-foreground max-w-md">
              Create, edit, and collaborate on documents in real-time with a modern, intuitive interface.
            </p>
            <Button onClick={() => setShowAuthModal(true)} size="lg" className="px-8">
              Get Started
            </Button>
          </div>
        </div>
        
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              DocuFlow
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.email}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Button variant="outline" onClick={onSignOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Search and Create */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button 
            onClick={handleCreateDocument} 
            className="flex items-center gap-2"
            disabled={creating}
          >
            <Plus className="h-4 w-4" />
            {creating ? 'Creating...' : 'New Document'}
          </Button>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Create your first document to get started'
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={handleCreateDocument} 
                className="flex items-center gap-2"
                disabled={creating}
              >
                <Plus className="h-4 w-4" />
                {creating ? 'Creating...' : 'Create First Document'}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(doc.updated_at)}
                      </CardDescription>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDocumentSelect(doc)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent 
                  className="pt-0"
                  onClick={() => onDocumentSelect(doc)}
                >
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {doc.content?.html ? 
                        doc.content.html.replace(/<[^>]*>/g, '').slice(0, 150) + '...' :
                        'No content yet...'
                      }
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {doc.is_public && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Private
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernDocumentDashboard;
