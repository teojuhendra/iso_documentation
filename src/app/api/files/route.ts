import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Return all files to match the frontend's local filtering expectation
    const files = await db.file.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const parentId = formData.get('parentId') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create file record in database
    const newFile = await db.file.create({
      data: {
        name: file.name,
        type: 'file',
        mimeType: file.type,
        size: file.size,
        path: `/uploads/${file.name}`, // This would be the actual path after saving
        parentId: parentId || null,
      }
    })
    
    return NextResponse.json(newFile)
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}