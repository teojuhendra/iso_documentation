import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, parentId } = await request.json()
    
    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }
    
    const newFolder = await db.file.create({
      data: {
        name,
        type: 'folder',
        parentId: parentId || null,
      }
    })
    
    return NextResponse.json(newFolder)
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}