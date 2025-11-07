import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { educationLevelId, blockchainKnowledgeLevelId, age } = await req.json();
    
    if (!educationLevelId || !blockchainKnowledgeLevelId || !age) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const result = await sql.query(
      'INSERT INTO Users (educationLevelId, blockchainKnowledgeLevelId, age) VALUES ($1, $2, $3) RETURNING id',
      [educationLevelId, blockchainKnowledgeLevelId, age]
    );

    const resultData = (result as any).rows || result;
    const firstRow = Array.isArray(resultData) ? resultData[0] : resultData;
    const userId = firstRow?.id;
    
    if (!userId) {
      return Response.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return Response.json({ success: true, userId });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}