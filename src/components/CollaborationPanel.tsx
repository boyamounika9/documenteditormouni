
import { useState } from 'react';
import { Users, Share2, Clock, Eye, MessageCircle, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Document } from '../types/document';

interface Collaborator {
  id: string;
  name: string;
  color: string;
  isTyping: boolean;
  cursor: number;
}

interface CollaborationPanelProps {
  collaborators: Collaborator[];
  document: Document;
}

const CollaborationPanel = ({ collaborators, document }: CollaborationPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'collaborators' | 'activity' | 'comments'>('collaborators');

  const activities = [
    { id: '1', user: 'Alice Johnson', action: 'edited paragraph 3', time: '2 min ago', color: '#3B82F6' },
    { id: '2', user: 'Bob Smith', action: 'added a new section', time: '5 min ago', color: '#10B981' },
    { id: '3', user: 'Charlie Brown', action: 'formatted text', time: '8 min ago', color: '#F59E0B' },
    { id: '4', user: 'Alice Johnson', action: 'added bullet points', time: '12 min ago', color: '#3B82F6' },
  ];

  const comments = [
    { id: '1', user: 'Alice Johnson', content: 'Should we expand on this section?', time: '10 min ago', color: '#3B82F6' },
    { id: '2', user: 'Bob Smith', content: 'Great work on the introduction!', time: '1 hour ago', color: '#10B981' },
  ];

  if (!isExpanded) {
    return (
      <div className="w-16 border-l border-gray-200 bg-gray-50 flex flex-col items-center py-4 gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="p-2"
        >
          <Users className="w-5 h-5 text-gray-600" />
        </Button>
        <div className="flex flex-col gap-2">
          {collaborators.slice(0, 3).map((collaborator) => (
            <div
              key={collaborator.id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium relative"
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.name.split(' ').map(n => n[0]).join('')}
              {collaborator.isTyping && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          ))}
          {collaborators.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium">
              +{collaborators.length - 3}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Collaboration</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-1">
          <Button
            variant={activeTab === 'collaborators' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('collaborators')}
            className="flex-1 text-xs"
          >
            <Users className="w-3 h-3 mr-1" />
            People
          </Button>
          <Button
            variant={activeTab === 'activity' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('activity')}
            className="flex-1 text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            Activity
          </Button>
          <Button
            variant={activeTab === 'comments' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('comments')}
            className="flex-1 text-xs"
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            Comments
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'collaborators' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Online ({collaborators.length})</h4>
              <Button variant="outline" size="sm">
                <Share2 className="w-3 h-3 mr-1" />
                Invite
              </Button>
            </div>

            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors">
                  <div className="relative">
                    <Avatar className="w-8 h-8" style={{ backgroundColor: collaborator.color }}>
                      <AvatarFallback className="text-white text-xs font-medium">
                        {collaborator.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {collaborator.isTyping && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{collaborator.name}</p>
                    <p className="text-xs text-gray-500">
                      {collaborator.isTyping ? 'Typing...' : 'Active now'}
                    </p>
                  </div>

                  <Button variant="ghost" size="sm" className="p-1">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Document Access</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sharing</span>
                  <Badge variant={document.is_public ? 'default' : 'secondary'}>
                    {document.is_public ? 'Public' : 'Private'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Permissions</span>
                  <span className="text-gray-500">Can edit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
            
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 p-2 rounded-lg hover:bg-white transition-colors">
                  <Avatar className="w-6 h-6 flex-shrink-0" style={{ backgroundColor: activity.color }}>
                    <AvatarFallback className="text-white text-xs">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Comments</h4>
              <Button variant="outline" size="sm">
                <MessageCircle className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-3">
                  <div className="flex gap-2 mb-2">
                    <Avatar className="w-6 h-6" style={{ backgroundColor: comment.color }}>
                      <AvatarFallback className="text-white text-xs">
                        {comment.user.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{comment.user}</span>
                        <span className="text-xs text-gray-500">{comment.time}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-3 h-3 mr-1" />
            View Mode
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Share2 className="w-3 h-3 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel;
