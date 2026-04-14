import { NextRequest, NextResponse } from "next/server";
import { resolveRouteParams, type RouteContext } from '@/lib/route-context';
import { withAuth } from "@/lib/auth-middleware";
import { ProjectService } from "@/lib/services/project-service";


/**
 * GET /api/projects/[id] - Get project by ID
 */
async function handleGET(request: NextRequest, user: any, params: any) {
  try {
    const project = await ProjectService.getProjectById(params.id, user.userId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * PUT /api/projects/[id] - Update project (owner or admin)
 */
async function handlePUT(request: NextRequest, user: any, params: any) {
  try {
    const project = await ProjectService.getProjectById(params.id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.creePar !== user.userId && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await ProjectService.updateProject(
      params.id,
      body,
      user.userId
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * DELETE /api/projects/[id] - Delete project (owner or admin)
 */
async function handleDELETE(request: NextRequest, user: any, params: any) {
  try {
    const project = await ProjectService.getProjectById(params.id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.creePar !== user.userId && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await ProjectService.deleteProject(params.id, user.userId);

    return NextResponse.json({ message: "Project deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const resolvedParams = await resolveRouteParams(context as any);
  return withAuth(request, (req, user) => handleGET(req, user, resolvedParams));
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const resolvedParams = await resolveRouteParams(context as any);
  return withAuth(request, (req, user) => handlePUT(req, user, resolvedParams));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const resolvedParams = await resolveRouteParams(context as any);
  return withAuth(request, (req, user) =>
    handleDELETE(req, user, resolvedParams)
  );
}
