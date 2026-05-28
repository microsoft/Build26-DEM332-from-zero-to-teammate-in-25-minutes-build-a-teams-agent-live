export type DemoProject = {
  id: string;
  name: string;
  summary: string;
  context: string;
};

export const demoProjects: DemoProject[] = [
  {
    id: 'conference-demo',
    name: 'Conference Demo',
    summary: 'Build the talk flow that starts in web chat, moves to Teams, then creates scoped teammates.',
    context: `
Project: Conference Demo
Goal: Show how fast we can build a Teams Agent using CLI scaffolding and Skills, then turn it into a scoped teammate.
Timeline: Rehearsal is Friday; final demo assets due next Tuesday.
Current workstreams:
- Existing PM helper web chat is working.
- Teams CLI scaffolding demo needs to stay under five minutes.
- RSC/group chat permissions need validation.
- Teammate blueprint story needs a crisp before/after moment.
Known risks:
- Demo environment credentials may expire.
- Group chat context can get muddled if one generic agent is reused everywhere.
- The CLI flow may run long if dependencies are not pre-staged.
Collaborators:
- Presentation and demo path
- Project-management workflow validation
- Teams app registration and permissions
`,
  },
  {
    id: 'mobile-redesign',
    name: 'Mobile Redesign',
    summary: 'Refresh the mobile onboarding flow and ship the first usability-tested slice.',
    context: `
Project: Mobile Redesign
Goal: Improve first-run onboarding completion by simplifying the welcome, profile, and notification setup screens.
Timeline: Design freeze this Thursday; beta build next Wednesday.
Current workstreams:
- UX has completed the first usability test pass.
- Engineering is implementing the profile setup screen.
- Analytics events are defined but not fully wired.
Known risks:
- Copy review is not scheduled yet.
- Analytics implementation may slip unless the event contract is finalized.
Collaborators:
- Product direction
- Design review
- Mobile engineering
`,
  },
  {
    id: 'billing-migration',
    name: 'Billing Migration',
    summary: 'Move legacy subscriptions to the new billing service with minimal customer impact.',
    context: `
Project: Billing Migration
Goal: Migrate legacy subscription records to the new billing service without duplicate charges or entitlement gaps.
Timeline: Internal migration dry run tomorrow; customer migration window starts in two weeks.
Current workstreams:
- Data export is complete.
- Reconciliation scripts are failing on some annual plans.
- Customer success needs the escalation playbook.
Known risks:
- Annual plan edge cases are blocking the dry run.
- Rollback steps are documented but not rehearsed.
- Support staffing is not confirmed for migration day.
Collaborators:
- Billing platform
- Customer-success readiness
- Migration validation
`,
  },
];

export function getDemoProject(projectId: string | undefined) {
  return demoProjects.find((project) => project.id === projectId) ?? demoProjects[0];
}
