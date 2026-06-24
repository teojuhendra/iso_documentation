import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Check if file exists
    const file = await db.file.findUnique({
      where: { id }
    })
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    
    // If it's a folder, delete all children first
    if (file.type === 'folder') {
      await db.file.deleteMany({
        where: { parentId: id }
      })
    }
    
    // Delete the file/folder
    await db.file.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { parentId, name } = await request.json()
    
    const updateData: any = {}
    if (parentId !== undefined) updateData.parentId = parentId
    if (name !== undefined) updateData.name = name
    
    const updatedFile = await db.file.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(updatedFile)
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}