import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { project_id, title, description, priority, assignee_name, due_date, milestone_id } = body;

    if (!project_id || !title) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from('autonoma_tasks')
      .insert({
        project_id,
        title,
        description: description || '',
        status: 'pending',
        priority: priority || 'normal',
        assignee_name: assignee_name || null,
        due_date: due_date || null,
        milestone_id: milestone_id || null,
        dependencies: []
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
