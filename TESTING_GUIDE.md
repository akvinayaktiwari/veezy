# Quick Start Testing Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Supabase project configured

## Environment Setup

### 1. Backend (.env in apps/api)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/veezy"
PORT=4000
```

### 2. Frontend (.env.local in apps/web)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
API_URL=http://localhost:4000
```

## Running the Application

### Terminal 1: Start Backend (NestJS)
```bash
cd apps/api
npm install
npm run start:dev
```
Backend should start on http://localhost:4000

### Terminal 2: Start Frontend (Next.js)
```bash
cd apps/web
npm install
npm run dev
```
Frontend should start on http://localhost:3000

### Terminal 3: Prisma Studio (Optional - View Database)
```bash
cd apps/api
npx prisma studio
```
Prisma Studio opens on http://localhost:5555

## Testing Checklist

### ✅ Initial Setup
- [ ] Both servers running without errors
- [ ] Can access http://localhost:3000
- [ ] Login page loads correctly

### ✅ Authentication Flow
- [ ] Click "Sign in with Google"
- [ ] Redirected to Supabase auth
- [ ] After login, redirected to /dashboard
- [ ] Profile dropdown shows your Google avatar/email

### ✅ Empty State (No Agents)
If you have no agents in database:
- [ ] See "No agents yet" empty state
- [ ] "Create Your First Agent" button visible
- [ ] Click button → navigate to /dashboard/agents/create
- [ ] See "Agent Creation Coming Soon" placeholder

### ✅ With Agents (Create Test Data)
Add test agent via Prisma Studio or SQL:
```sql
INSERT INTO "Agent" (id, name, "tenantId", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Sales Agent', 'your-tenant-id', NOW(), NOW());
```

Then verify:
- [ ] Dashboard shows stats grid (4 cards)
- [ ] Agent selector in header shows "Sales Agent"
- [ ] Can click dropdown and see agent listed
- [ ] Selecting agent updates localStorage
- [ ] Page refresh maintains selection

### ✅ Desktop Navigation (≥1024px)
- [ ] Full sidebar visible on left (width: 256px)
- [ ] All 7 nav items show with labels
- [ ] Active page highlighted in blue
- [ ] No hamburger menu visible
- [ ] Create button shows "Create Agent"
- [ ] Agent selector shows full width

### ✅ Tablet Navigation (768-1023px)
- [ ] Collapsed sidebar visible (width: 80px, icons only)
- [ ] Hover over icons → tooltips appear
- [ ] Hamburger menu still visible
- [ ] Create button shows "Create"
- [ ] Main content has left padding

### ✅ Mobile Navigation (<768px)
- [ ] No sidebar visible
- [ ] Hamburger menu visible in header
- [ ] Click hamburger → drawer slides in from left
- [ ] Click nav item in drawer → drawer closes
- [ ] Navigate to selected page
- [ ] Create button shows icon only
- [ ] Agent selector compact

### ✅ Feature Pages
Navigate to each and verify Coming Soon design:
- [ ] /dashboard/analytics
- [ ] /dashboard/knowledge
- [ ] /dashboard/links
- [ ] /dashboard/import
- [ ] /dashboard/email
- [ ] /dashboard/settings

Each should show:
- [ ] Page title with "Coming Soon" badge
- [ ] Agent name in subtitle
- [ ] Feature card with icon
- [ ] Feature description
- [ ] 6 bulleted capabilities
- [ ] Disabled "Notify Me" button

### ✅ Agent Context Persistence
- [ ] Select an agent from dropdown
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Verify `veezy_selected_agent` key exists with agent ID
- [ ] Refresh page → same agent selected
- [ ] Close and reopen browser → same agent selected

### ✅ Sign Out Flow
- [ ] Click profile dropdown in header
- [ ] See your email and avatar
- [ ] Click "Sign Out"
- [ ] See toast notification "Signed out successfully"
- [ ] Redirected to /auth/login
- [ ] Try accessing /dashboard → redirected back to login
- [ ] Sign in again → everything works

### ✅ Browser DevTools Console
- [ ] No error messages
- [ ] No warning messages (except Tailwind suggestion)
- [ ] Network tab shows successful API calls

## Common Issues & Fixes

### Issue: Backend not starting
**Cause:** Database connection failed  
**Fix:** Check DATABASE_URL in apps/api/.env

### Issue: Frontend shows 401 errors
**Cause:** Not logged in or session expired  
**Fix:** Sign out and sign in again

### Issue: Agent selector shows "No agents"
**Cause:** No agents in database for your tenant  
**Fix:** Add agent via Prisma Studio (see SQL above)

### Issue: Create Agent button doesn't navigate
**Cause:** Fixed in commit e638141  
**Fix:** Pull latest changes from feature/agent-selection

### Issue: Profile dropdown shows no avatar
**Cause:** Google account has no avatar_url  
**Fix:** Expected behavior - shows colored initials instead

### Issue: Mobile drawer doesn't close
**Cause:** JavaScript error  
**Fix:** Check browser console for errors

## Browser Compatibility

Tested and verified on:
- ✅ Chrome 120+
- ✅ Firefox 121+
- ✅ Safari 17+
- ✅ Edge 120+

## Performance Expectations

- Initial page load: < 2s
- Agent selection change: < 100ms
- Navigation between pages: < 500ms
- Mobile drawer animation: 300ms
- API response time: < 200ms (local)

## Next Steps

Once all tests pass:
- ✅ Dashboard UI is complete and ready
- ✅ Proceed to Phase 6: Agent CRUD implementation
- ✅ Build agent creation form
- ✅ Add agent edit/delete functionality

## Support

If you encounter issues:
1. Check DASHBOARD_VERIFICATION.md for detailed component docs
2. Review git commits for change history
3. Verify environment variables are correct
4. Check both backend and frontend logs
