'use client';

import { FolderKanban, MapPin, Briefcase, TrendingUp, ArrowRight } from 'lucide-react';
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
  accentColor,
  accentBg,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  href: string;
  isLoading: boolean;
  accentColor: string;
  accentBg: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 w-1 rounded-l-lg transition-all group-hover:w-1.5"
          style={{ backgroundColor: accentColor }}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
            style={{ backgroundColor: accentBg }}
          >
            <Icon className="h-4.5 w-4.5" style={{ color: accentColor }} />
          </div>
        </CardHeader>
        <CardContent className="pl-5">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-3xl font-bold tracking-tight">{value}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
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
          accentColor="#8b5cf6"
          accentBg="#f5f3ff"
        />
        <StatCard
          title="Total Sites"
          value={sites?.length ?? 0}
          description="Across all projects"
          icon={MapPin}
          href="/sites"
          isLoading={sitesLoading}
          accentColor="#10b981"
          accentBg="#ecfdf5"
        />
        <StatCard
          title="Total Jobs"
          value={jobs?.length ?? 0}
          description="All job entries"
          icon={Briefcase}
          href="/jobs"
          isLoading={jobsLoading}
          accentColor="#f59e0b"
          accentBg="#fffbeb"
        />
        <Card className="relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 w-1 rounded-l-lg"
            style={{ backgroundColor: '#3b82f6' }}
          />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overview</CardTitle>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#eff6ff' }}
            >
              <TrendingUp className="h-4.5 w-4.5" style={{ color: '#3b82f6' }} />
            </div>
          </CardHeader>
          <CardContent className="pl-5">
            <div className="text-2xl font-bold" style={{ color: '#10b981' }}>Active</div>
            <p className="text-xs text-muted-foreground mt-1">System operational</p>
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
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-all hover:bg-muted/50 hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: '#f5f3ff' }}>
                        <FolderKanban className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {project.workOrderNumber}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
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
              className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 hover:shadow-sm group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: '#f5f3ff' }}>
                <FolderKanban className="h-4.5 w-4.5" style={{ color: '#8b5cf6' }} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Create Project</p>
                <p className="text-xs text-muted-foreground">Start a new project</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
            <Link
              href="/sites?create=true"
              className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 hover:shadow-sm group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: '#ecfdf5' }}>
                <MapPin className="h-4.5 w-4.5" style={{ color: '#10b981' }} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Add Site</p>
                <p className="text-xs text-muted-foreground">Add a new site to a project</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
            <Link
              href="/jobs?create=true"
              className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 hover:shadow-sm group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: '#fffbeb' }}>
                <Briefcase className="h-4.5 w-4.5" style={{ color: '#f59e0b' }} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Create Job</p>
                <p className="text-xs text-muted-foreground">Add a new job to a site</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
