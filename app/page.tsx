'use client';

import { FolderKanban, MapPin, Briefcase, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/use-projects';
import { useSites } from '@/hooks/use-sites';
import { useJobs } from '@/hooks/use-jobs';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  isLoading,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  href: string;
  isLoading: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: sites, isLoading: sitesLoading } = useSites();
  const { data: jobs, isLoading: jobsLoading } = useJobs();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Consecure. Manage your projects, sites, and jobs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={projects?.length ?? 0}
          description="Active and completed"
          icon={FolderKanban}
          href="/projects"
          isLoading={projectsLoading}
        />
        <StatCard
          title="Total Sites"
          value={sites?.length ?? 0}
          description="Across all projects"
          icon={MapPin}
          href="/sites"
          isLoading={sitesLoading}
        />
        <StatCard
          title="Total Jobs"
          value={jobs?.length ?? 0}
          description="All job entries"
          icon={Briefcase}
          href="/jobs"
          isLoading={jobsLoading}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overview</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">System operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Latest projects added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.clientName}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {project.workOrderNumber}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No projects yet. Create one to get started.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href="/projects?create=true"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
            >
              <FolderKanban className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Create Project</p>
                <p className="text-sm text-muted-foreground">Start a new project</p>
              </div>
            </Link>
            <Link
              href="/sites?create=true"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
            >
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Add Site</p>
                <p className="text-sm text-muted-foreground">Add a new site to a project</p>
              </div>
            </Link>
            <Link
              href="/jobs?create=true"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
            >
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Create Job</p>
                <p className="text-sm text-muted-foreground">Add a new job to a site</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
