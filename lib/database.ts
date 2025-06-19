// Mock database implementation
// Replace with actual database (PostgreSQL, MongoDB, etc.) in production

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
  avatar?: string;
}

export interface Meeting {
  id: string;
  title: string;
  status: 'active' | 'scheduled' | 'ended';
  isRecording: boolean;
  participants: Participant[];
  createdAt: string;
  startTime: string;
  endTime?: string;
  maxParticipants: number;
  hostId: string;
}

export interface Participant {
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

// Mock storage (replace with actual database)
const users: User[] = [];
const meetings: Meeting[] = [];

export class Database {
  // User operations
  static async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    return user;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return users.find(user => user.email === email) || null;
  }

  static async getUserById(id: string): Promise<User | null> {
    return users.find(user => user.id === id) || null;
  }

  // Meeting operations
  static async createMeeting(meetingData: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting> {
    const meeting: Meeting = {
      ...meetingData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    meetings.push(meeting);
    return meeting;
  }

  static async getMeetingById(id: string): Promise<Meeting | null> {
    return meetings.find(meeting => meeting.id === id) || null;
  }

  static async getMeetingsByUserId(userId: string): Promise<Meeting[]> {
    return meetings.filter(meeting => 
      meeting.participants.some(p => p.id === userId)
    );
  }

  static async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | null> {
    const meetingIndex = meetings.findIndex(meeting => meeting.id === id);
    if (meetingIndex === -1) return null;

    meetings[meetingIndex] = { ...meetings[meetingIndex], ...updates };
    return meetings[meetingIndex];
  }

  static async addParticipantToMeeting(meetingId: string, participant: Participant): Promise<boolean> {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) return false;

    const existingParticipant = meeting.participants.find(p => p.id === participant.id);
    if (existingParticipant) return true;

    meeting.participants.push(participant);
    return true;
  }

  static async removeParticipantFromMeeting(meetingId: string, participantId: string): Promise<boolean> {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) return false;

    const participantIndex = meeting.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) return false;

    meeting.participants[participantIndex].leftAt = new Date().toISOString();
    return true;
  }

  static async updateParticipant(
    meetingId: string, 
    participantId: string, 
    updates: Partial<Participant>
  ): Promise<boolean> {
    const meeting = await this.getMeetingById(meetingId);
    if (!meeting) return false;

    const participantIndex = meeting.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) return false;

    meeting.participants[participantIndex] = { 
      ...meeting.participants[participantIndex], 
      ...updates 
    };
    return true;
  }
}