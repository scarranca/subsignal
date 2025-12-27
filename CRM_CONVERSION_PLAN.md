# Subsignal → CRM Conversion Plan

## Executive Summary

This document outlines the plan to convert Subsignal from a **Deal Flow Monitoring** platform to a **CRM (Customer Relationship Management)** system. The conversion requires significant architectural changes while leveraging the existing solid technical foundation.

**Estimated Effort**: 4-5 months for MVP
**Risk Level**: Medium-High (domain model redesign)

---

## Phase 1: Data Model Redesign (2-3 weeks)

### 1.1 New Database Tables

```sql
-- Core CRM entities
contacts (
  id, companyId, userId,
  firstName, lastName, email, phone, title, role,
  linkedinUrl, twitterUrl,
  status (active, inactive, archived),
  source (manual, import, linkedin, referral),
  createdAt, updatedAt
)

deals (
  id, companyId, contactId, userId,
  name, value, currency,
  stage (lead, qualified, proposal, negotiation, won, lost),
  probability, expectedCloseDate, actualCloseDate,
  lostReason,
  createdAt, updatedAt
)

interactions (
  id, companyId, contactId, dealId, userId,
  type (call, email, meeting, note, task),
  subject, content (rich text),
  direction (inbound, outbound),
  duration, scheduledAt, completedAt,
  createdAt, updatedAt
)

tasks (
  id, userId, assignedToId,
  companyId, contactId, dealId,
  title, description,
  priority (low, medium, high, urgent),
  dueDate, completedAt,
  status (pending, in_progress, completed, cancelled),
  createdAt, updatedAt
)

activity_log (
  id, userId, entityType, entityId,
  action (created, updated, deleted, stage_changed),
  changes (JSONB - before/after diff),
  createdAt
)

tags (
  id, userId, name, color,
  createdAt
)

entity_tags (
  id, tagId, entityType, entityId
)

custom_fields (
  id, userId, entityType,
  name, fieldType (text, number, date, select, multiselect),
  options (JSONB for select types),
  required, position,
  createdAt
)

custom_field_values (
  id, customFieldId, entityType, entityId,
  value (JSONB),
  createdAt, updatedAt
)

pipelines (
  id, userId, name, isDefault,
  createdAt, updatedAt
)

pipeline_stages (
  id, pipelineId,
  name, position, color, probability,
  createdAt, updatedAt
)
```

### 1.2 Modify Existing Tables

```sql
-- Update company table
ALTER TABLE company ADD COLUMN (
  industry VARCHAR(255),
  size (startup, small, medium, large, enterprise),
  website VARCHAR(500),
  description TEXT,
  address JSONB,
  annualRevenue DECIMAL,
  employeeCount INTEGER,
  tags TEXT[],
  customFields JSONB
);

-- Keep page/snapshot/briefing for optional AI monitoring feature
-- (can be a premium add-on)
```

### 1.3 Migration Strategy

1. Create new tables with Drizzle migrations
2. Preserve existing data (companies, users, billing)
3. Map existing `page` monitoring to optional feature
4. Migrate `preference` to pipeline configuration

---

## Phase 2: Core CRM Features (6-8 weeks)

### 2.1 Contact Management (Week 1-2)

**API Endpoints:**
```
POST   /api/v1/contacts          - Create contact
GET    /api/v1/contacts          - List contacts (paginated, filterable)
GET    /api/v1/contacts/:id      - Get contact details
PATCH  /api/v1/contacts/:id      - Update contact
DELETE /api/v1/contacts/:id      - Delete contact
POST   /api/v1/contacts/import   - Bulk import (CSV, LinkedIn)
POST   /api/v1/contacts/merge    - Merge duplicates
```

**UI Components:**
- `ContactsView.tsx` - List/grid view with filters
- `ContactDetail.tsx` - Full contact profile
- `ContactForm.tsx` - Create/edit modal
- `ContactCard.tsx` - Summary card component

### 2.2 Deal Pipeline (Week 2-4)

**API Endpoints:**
```
POST   /api/v1/deals             - Create deal
GET    /api/v1/deals             - List deals (paginated, filterable)
GET    /api/v1/deals/:id         - Get deal details
PATCH  /api/v1/deals/:id         - Update deal
DELETE /api/v1/deals/:id         - Delete deal
PATCH  /api/v1/deals/:id/stage   - Move to stage
GET    /api/v1/deals/pipeline    - Get pipeline view data
GET    /api/v1/deals/forecast    - Revenue forecast

POST   /api/v1/pipelines         - Create pipeline
GET    /api/v1/pipelines         - List pipelines
PATCH  /api/v1/pipelines/:id     - Update pipeline
```

**UI Components:**
- `PipelineView.tsx` - Kanban board (drag-drop stages)
- `DealCard.tsx` - Deal summary in pipeline
- `DealDetail.tsx` - Full deal view with timeline
- `DealForm.tsx` - Create/edit modal
- `PipelineSettings.tsx` - Customize stages

### 2.3 Interaction Logging (Week 4-5)

**API Endpoints:**
```
POST   /api/v1/interactions      - Log interaction
GET    /api/v1/interactions      - List interactions (filterable)
GET    /api/v1/interactions/:id  - Get interaction details
PATCH  /api/v1/interactions/:id  - Update interaction
DELETE /api/v1/interactions/:id  - Delete interaction
```

**UI Components:**
- `InteractionTimeline.tsx` - Activity timeline
- `LogCallForm.tsx` - Quick call logging
- `LogEmailForm.tsx` - Email logging
- `LogMeetingForm.tsx` - Meeting notes
- `QuickNoteForm.tsx` - Add note to entity

### 2.4 Task Management (Week 5-6)

**API Endpoints:**
```
POST   /api/v1/tasks             - Create task
GET    /api/v1/tasks             - List tasks (filterable)
PATCH  /api/v1/tasks/:id         - Update task
DELETE /api/v1/tasks/:id         - Delete task
POST   /api/v1/tasks/:id/complete - Mark complete
```

**UI Components:**
- `TasksView.tsx` - Task list/calendar view
- `TaskForm.tsx` - Create/edit task
- `TaskReminders.tsx` - Due date notifications

### 2.5 Activity Timeline (Week 6-7)

**Features:**
- Unified timeline across all entities
- Filter by activity type
- Infinite scroll loading
- Real-time updates

### 2.6 Search & Filtering (Week 7-8)

**Features:**
- Global search across all entities
- Advanced filters (saved filters)
- Custom field filtering
- Full-text search with PostgreSQL

---

## Phase 3: UI/UX Redesign (4-6 weeks)

### 3.1 Navigation Restructure

**Current:**
```
Dashboard
├── Companies (with pages/monitoring)
├── Briefings
├── Settings
└── Integrations
```

**New:**
```
Dashboard (Overview metrics)
├── Deals (Pipeline/List view)
├── Companies (CRM companies)
├── Contacts (People)
├── Activities (Timeline)
├── Tasks (To-dos)
├── Reports (Analytics)
├── Settings
│   ├── Profile
│   ├── Pipeline Settings
│   ├── Custom Fields
│   ├── Integrations
│   └── Team (future)
└── [Optional] Monitoring (AI briefings - premium)
```

### 3.2 Key Views to Build

1. **Dashboard Overview**
   - Pipeline funnel chart
   - Revenue forecast
   - Upcoming tasks
   - Recent activities
   - Top deals

2. **Pipeline Board**
   - Drag-drop Kanban
   - Deal cards with key info
   - Stage totals
   - Filter/sort options

3. **Company Profile**
   - Company info header
   - Related contacts list
   - Deals associated
   - Activity timeline
   - Files/documents
   - Notes section

4. **Contact Profile**
   - Contact details
   - Communication history
   - Related deals
   - Activity timeline
   - Quick actions (call, email)

5. **Reports Dashboard**
   - Pipeline analytics
   - Conversion rates
   - Activity metrics
   - Revenue forecasting

### 3.3 Component Library Updates

- Add Kanban board component (react-beautiful-dnd or similar)
- Add timeline component
- Add chart components (recharts/chart.js)
- Add rich text editor (tiptap/slate)
- Add date range picker

---

## Phase 4: Integrations (4-6 weeks)

### 4.1 Email Sync (Week 1-2)

**Features:**
- Gmail/Outlook OAuth connection
- Automatic email logging to contacts
- Email templates
- Track email opens

**Implementation:**
- Gmail API / Microsoft Graph API
- Background sync via Inngest
- Email threading and association

### 4.2 Calendar Integration (Week 2-3)

**Features:**
- Google Calendar / Outlook sync
- Meeting scheduling
- Automatic meeting logging
- Calendar view in CRM

### 4.3 Data Import/Export (Week 3-4)

**Features:**
- CSV import for contacts/companies/deals
- LinkedIn import (via CSV)
- Salesforce/HubSpot import
- Full data export (GDPR compliance)

### 4.4 Third-Party CRM Sync (Week 4-6)

**Features:**
- Affinity integration
- AngelList integration
- HubSpot sync
- Zapier webhook support

---

## Phase 5: Team & Multi-Tenancy (Future Phase)

### 5.1 Team Structure
- Organizations/workspaces
- Team member invitations
- Role-based access (Admin, Manager, User, Viewer)
- Activity attribution

### 5.2 Permissions
- Entity-level permissions
- Pipeline access control
- Report access levels

---

## Implementation Priority Matrix

| Feature | Business Value | Effort | Priority |
|---------|---------------|--------|----------|
| Contact Management | High | Medium | P0 |
| Deal Pipeline | High | High | P0 |
| Company Profiles | High | Low | P0 |
| Interaction Logging | High | Medium | P1 |
| Task Management | Medium | Medium | P1 |
| Activity Timeline | Medium | Medium | P1 |
| Custom Fields | Medium | High | P2 |
| Email Integration | High | High | P2 |
| Calendar Sync | Medium | Medium | P2 |
| Reports/Analytics | Medium | High | P2 |
| Team Features | High | Very High | P3 |
| Third-party Integrations | Medium | High | P3 |

---

## Technical Decisions

### Keep From Current Architecture
- ✅ Next.js 15 + React 19
- ✅ TypeScript throughout
- ✅ Drizzle ORM + PostgreSQL
- ✅ Hono.js API routes
- ✅ Inngest for background jobs
- ✅ Better Auth for authentication
- ✅ Radix UI components
- ✅ Tailwind CSS
- ✅ React Query for data fetching
- ✅ DodoPayments for billing

### Add New Dependencies
- `@dnd-kit/core` - Drag and drop for Kanban
- `@tiptap/react` - Rich text editor
- `recharts` or `chart.js` - Analytics charts
- `date-fns` - Date manipulation (already present)
- `@tanstack/react-table` - Advanced data tables

### Remove/Deprecate
- Snapshot/monitoring system (move to optional premium feature)
- Web archive integration
- AI briefing as core feature (move to add-on)

---

## Migration Path for Existing Users

1. **Communication**: Email existing users about transition
2. **Data Preservation**: Keep all company data, map to new model
3. **Feature Flagging**: Maintain monitoring as legacy feature
4. **Gradual Rollout**:
   - Phase 1: Add CRM features alongside monitoring
   - Phase 2: CRM becomes primary, monitoring becomes add-on
   - Phase 3: Full CRM with optional AI monitoring

---

## Success Metrics

- User activation: % completing onboarding
- Deal creation rate
- Pipeline value tracked
- Daily active users
- Feature adoption rates
- Churn reduction

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep | Strict MVP definition, feature flags |
| Data migration issues | Extensive testing, rollback plan |
| Performance with scale | Index optimization, query analysis |
| User confusion during transition | Clear communication, tutorials |
| Competition (HubSpot, Pipedrive) | Focus on VC/startup niche |

---

## Recommended First Steps

1. **Week 1**:
   - Set up new database schema
   - Create migration scripts
   - Build Contact CRUD API

2. **Week 2**:
   - Build Contact UI components
   - Update company model with CRM fields
   - Create basic contact list view

3. **Week 3**:
   - Build Deal/Pipeline schema
   - Create Pipeline API
   - Start Kanban UI component

4. **Week 4**:
   - Complete Pipeline Kanban view
   - Add deal forms
   - Connect deals to contacts/companies

This phased approach allows for iterative development while maintaining a working product throughout the transition.
