import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
export const dynamic = 'force-dynamic';
// Mock database - replace with actual database in production
const users: any[] = [
  {
    id: '1',
    email: 'u1@gmail.com',
    name: 'Test User',
    password: 'u1', // Plain password for testing
    createdAt: new Date().toISOString()
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    console.log('Request received:', request.method, request.url);
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));
    const { action, email, password, name } = body;

    if (action === 'register') {
      // Check if user already exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = {
        id: Date.now().toString(),
        email,
        name,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };

      users.push(user);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    if (action === 'login') {
      console.log('Login attempt:', { email, passwordLength: password?.length });
      console.log('Available users:', users.map(u => ({ id: u.id, email: u.email })));
      
      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        console.log('User not found');
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
      }

      // Check password (simple comparison for testing)
      const isPasswordValid = password === user.password;
      console.log('Password validation result:', isPasswordValid, 'Input:', password, 'Stored:', user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}