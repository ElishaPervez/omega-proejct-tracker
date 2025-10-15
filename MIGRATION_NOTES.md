# Migration Notes

## Revenue → Budget Rename

**Date:** 2025-10-16

### What Changed:
- Renamed `revenue` field to `budget` in Project model
- Updated all Discord commands to use "budget" instead of "revenue"
- Updated web dashboard to display budget
- Changed semantics: "revenue" (finalized price) → "budget" (estimated cost)

### How to Update:

**For existing databases:**
```bash
refresh.bat
```

This will:
1. Clear the old database
2. Recreate tables with the new schema
3. Re-register Discord commands

**NOTE:** This will delete all existing data! Export important data before running.

### What Users Will See:
- Discord command: `/project create budget:1000` (instead of `revenue:1000`)
- Web dashboard: "Budget: $1000.00" on project cards
- Client views: Total budget calculated from projects + invoices

### Database Schema Change:
```sql
-- Old:
revenue Float @default(0)

-- New:
budget Float @default(0)
```
