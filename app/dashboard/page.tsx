'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { 
  Video, 
  Plus, 
  Users, 
  Calendar, 
  Settings, 
  LogOut,
  Copy,
  Clock,
  Play,
  UserPlus
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'guest' | 'producer';
  isRecordingAllowed: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isHost: boolean;
  joinedAt: string;
  leftAt?: string;
}

interface Meeting {
  id: string;
  title: string;
  status: 'active' | 'scheduled' | 'ended';
  participants: Participant[];
  maxParticipants: number;
  createdAt: string;
  scheduledAt?: string;
  duration?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      // Check authentication
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        router.push('/');
        return;
      }

      try {
        setUser(JSON.parse(userData));
        fetchMeetings();
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        router.push('/');
      }
    }
  }, [router]);

  const fetchMeetings = async () => {
    try {
      // Get token safely
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await fetch('/api/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
      } else {
        console.error('Failed to fetch meetings:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    }
  };

  const createMeeting = async () => {
    if (!newMeetingTitle.trim()) return;

    try {
      // Get token safely
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to create a meeting.",
          variant: "destructive",
        });
        return;
      }
      
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newMeetingTitle,
          action: 'create',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        router.push(`/meeting/${data.roomId}`);
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to create meeting',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const joinMeeting = async () => {
    if (!joinRoomId.trim()) return;
    
    try {
      // Get token safely
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to join a meeting.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if the meeting exists before joining
      const response = await fetch(`/api/rooms/${joinRoomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'checkExists' }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.exists) {
        router.push(`/meeting/${joinRoomId}`);
      } else {
        toast({
          title: "Meeting Not Found",
          description: "The meeting you're trying to join doesn't exist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to check meeting:', error);
      toast({
        title: "Error",
        description: "Failed to join meeting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Room ID Copied",
      description: "Meeting ID has been copied to clipboard.",
    });
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  if (!user || typeof user !== 'object') {
    return <div>Loading user data...</div>;
  }
  
  // Also add logging
  console.log('Rendering dashboard with user:', JSON.stringify(user, null, 2));
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Video className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">MeetingFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New Meeting</span>
              </CardTitle>
              <CardDescription className="text-blue-100">
                Start an instant meeting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Meeting title"
                value={newMeetingTitle}
                onChange={(e) => setNewMeetingTitle(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
              />
              <Button
                onClick={createMeeting}
                className="w-full bg-white text-blue-600 hover:bg-white/90"
              >
                Create Meeting
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Join Meeting</span>
              </CardTitle>
              <CardDescription className="text-teal-100">
                Enter a meeting ID to join an existing meeting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter meeting ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
              />
              <Button
                onClick={joinMeeting}
                className="w-full bg-white text-teal-600 hover:bg-white/90"
              >
                Join Meeting
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your Meetings</h2>
          </div>

          <div className="grid gap-4">
            {meetings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No meetings yet. Create your first meeting to get started!</p>
                </CardContent>
              </Card>
            ) : (
              meetings.map((meeting) => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                          <Badge className={getStatusColor(meeting.status)}>
                            {meeting.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {meeting.participants.length}/{meeting.maxParticipants}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {meeting.duration || 'No duration'}
                          </span>
                          <span>ID: {meeting.id}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyRoomId(meeting.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {meeting.status === 'active' ? (
                          <Button
                            onClick={() => router.push(`/meeting/${meeting.id}`)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Join
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/meeting/${meeting.id}`)}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}