export type DeploymentStatus = 'ready' | 'watch';

export type DeploymentChecklistItem = {
  id: string;
  area: string;
  title: string;
  status: DeploymentStatus;
  whyItMatters: string;
  verification: string;
};

export const demoDeploymentChecklist: DeploymentChecklistItem[] = [
  {
    id: 'deploy-001',
    area: 'environment',
    title: 'Keep the app in manual-safe send mode',
    status: 'ready',
    whyItMatters: 'The MVP should never start a deploy with live outbound behavior enabled by accident.',
    verification: 'Confirm the deployed environment sets `SEND_MODE=manual` and only operators with explicit approval can change it.',
  },
  {
    id: 'deploy-002',
    area: 'database',
    title: 'Run Prisma migrations before promoting the build',
    status: 'ready',
    whyItMatters: 'Timeline, audit-log, feedback, and CSV-import flows all depend on the latest schema.',
    verification: 'Run `npx prisma migrate deploy` against the target database and verify it finishes without pending migrations.',
  },
  {
    id: 'deploy-003',
    area: 'application',
    title: 'Smoke test the seeded operator workflow after release',
    status: 'ready',
    whyItMatters: 'A green build is not enough; operators need the queue, timeline, audit log, and CSV preview visible in the deployed app.',
    verification: 'Open `/` after deploy and confirm the dashboard shows queue metrics, recent audit entries, timeline cards, manual QA coverage, and the CSV preview section.',
  },
  {
    id: 'deploy-004',
    area: 'rollback',
    title: 'Have a rollback target before touching the integration branch',
    status: 'watch',
    whyItMatters: 'This repo ships stacked PRs, so rollback needs a known-good branch or commit instead of improvising under pressure.',
    verification: 'Record the previous good commit/branch, keep the prior deployment artifact available, and be ready to redeploy it before merging the next stacked slice.',
  },
];
