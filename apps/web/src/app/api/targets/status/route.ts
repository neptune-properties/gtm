import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from "@/lib/supabaseClient";

export async function PUT(request: NextRequest) {
  try {
    const { targetId, status } = await request.json()

    if (!targetId || !status) {
      return NextResponse.json(
        { error: 'Target ID and status are required' },
        { status: 400 }
      )
    }

    const supabase = supabaseServer()

    const { data, error } = await supabase
      .from('targets')
      .update({ status })
      .eq('id', targetId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update target status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Status updated successfully',
      target: data[0] 
    })
  } catch (error) {
    console.error('Error updating target status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}