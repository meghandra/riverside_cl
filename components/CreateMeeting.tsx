'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface CreateMeetingProps {
  onCreateMeeting: (title: string) => void;
  loading?: boolean;
}

export default function CreateMeeting({ onCreateMeeting, loading = false }: CreateMeetingProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateMeeting(title.trim());
      setTitle('');
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Create New Meeting</span>
        </CardTitle>
        <CardDescription className="text-blue-100">
          Start an instant meeting or schedule for later
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Meeting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
            required
          />
          <Button
            type="submit"
            className="w-full bg-white text-blue-600 hover:bg-white/90"
            disabled={loading || !title.trim()}
          >
            {loading ? 'Creating...' : 'Create Meeting'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}