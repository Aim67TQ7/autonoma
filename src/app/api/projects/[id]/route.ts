import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('autonoma_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch related data
    const [charterRes, milestonesRes, tasksRes, risksRes, stakeholdersRes] = await Promise.all([
      supabase
        .from('autonoma_charters')
        .select('*')
        .eq('project_id', id)
        .order('version', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('autonoma_milestones')
        .select('*')
        .eq('project_id', id)
        .order('target_date', { ascending: true }),
      supabase
        .from('autonoma_tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('autonoma_risks')
        .select('*')
        .eq('project_id', id),
      supabase
        .from('autonoma_stakeholders')
        .select('*')
        .eq('project_id', id)
    ]);

    return NextResponse.json({
      project,
      charter: charterRes.data,
      milestones: milestonesRes.data || [],
      tasks: tasksRes.data || [],
      risks: risksRes.data || [],
      stakeholders: stakeholdersRes.data || []
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('autonoma_projects')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('autonoma_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
