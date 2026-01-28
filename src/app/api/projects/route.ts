import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateCharter, determineProjectScale, calculateHealthScore } from '@/lib/ai';
import { ProjectIntakeData } from '@/types';

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: projects, error } = await supabase
      .from('autonoma_projects')
      .select(`
        id,
        name,
        status,
        health_score,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get task counts for each project
    const projectsWithTasks = await Promise.all(
      (projects || []).map(async (project) => {
        const { data: tasks } = await supabase
          .from('autonoma_tasks')
          .select('status')
          .eq('project_id', project.id);

        const totalTasks = tasks?.length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;

        return {
          ...project,
          tasks_total: totalTasks,
          tasks_completed: completedTasks
        };
      })
    );

    return NextResponse.json({ projects: projectsWithTasks });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', projects: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { projectData } = body as { projectData: ProjectIntakeData };

    if (!projectData?.name || !projectData?.objective) {
      return NextResponse.json(
        { error: 'Project name and objective are required' },
        { status: 400 }
      );
    }

    // Generate charter using AI
    const charter = await generateCharter(projectData);
    const scale = determineProjectScale(projectData);

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('autonoma_projects')
      .insert({
        name: projectData.name,
        description: projectData.description || projectData.objective,
        status: 'active',
        scale,
        objective: projectData.objective,
        success_criteria: projectData.success_criteria || [],
        constraints: projectData.constraints || [],
        target_end_date: projectData.target_timeline,
        health_score: 85, // Initial optimistic score
        intake_data: projectData
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Create charter
    const { error: charterError } = await supabase
      .from('autonoma_charters')
      .insert({
        project_id: project.id,
        version: 1,
        content: charter
      });

    if (charterError) throw charterError;

    // Create milestones from charter
    if (charter.timeline && charter.timeline.length > 0) {
      const milestones = charter.timeline.map(m => ({
        project_id: project.id,
        name: m.name,
        description: m.description,
        target_date: m.target_date,
        status: 'pending',
        completion_percentage: 0
      }));

      await supabase.from('autonoma_milestones').insert(milestones);
    }

    // Create stakeholders from charter
    if (charter.stakeholders && charter.stakeholders.length > 0) {
      const stakeholders = charter.stakeholders.map(s => ({
        project_id: project.id,
        name: s.name,
        role: s.role,
        raci_level: s.raci_level
      }));

      await supabase.from('autonoma_stakeholders').insert(stakeholders);
    }

    // Create risks from charter
    if (charter.risks && charter.risks.length > 0) {
      const risks = charter.risks.map(r => ({
        project_id: project.id,
        description: r.description,
        probability: r.probability,
        impact: r.impact,
        mitigation: r.mitigation,
        status: 'identified'
      }));

      await supabase.from('autonoma_risks').insert(risks);
    }

    return NextResponse.json({ project, charter });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
