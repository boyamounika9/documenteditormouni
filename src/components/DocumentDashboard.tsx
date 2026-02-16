
import { useState } from 'react';
import { Plus, Search, Grid3X3, List, Users, Clock, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Document } from '../types/document';

interface DocumentDashboardProps {
  documents: Document[];
  onCreateDocument: () => void;
  onOpenDocument: (doc: Document) => void;
}

const DocumentDashboard = ({ documents, onCreateDocument, onOpenDocument }: DocumentDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Documents</h1>
        <p className="text-gray-600">Create, edit, and collaborate on documents in real-time</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button 
          onClick={onCreateDocument}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
        
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Documents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((doc) => (
            <Card 
              key={doc.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
              onClick={() => onOpenDocument(doc)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {doc.title}
                  </CardTitle>
                  {doc.is_public && (
                    <Share2 className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {doc.content?.html ? 
                      doc.content.html.replace(/<[^>]*>/g, '').slice(0, 100) + '...' :
                      'No content yet...'
                    }
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(doc.updated_at)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={doc.is_public ? "default" : "secondary"} className="text-xs">
                      {doc.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <Card 
              key={doc.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 group"
              onClick={() => onOpenDocument(doc)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {doc.content?.html ? 
                        doc.content.html.replace(/<[^>]*>/g, '').slice(0, 100) :
                        'No content yet...'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-4">
                    {doc.is_public && <Share2 className="w-4 h-4 text-blue-500" />}
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatDate(doc.updated_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Create your first document to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={onCreateDocument} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Document
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentDashboard;
