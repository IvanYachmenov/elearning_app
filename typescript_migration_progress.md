# TypeScript Migration Progress

## Status

Completed stages:
- Stage 0. TypeScript infrastructure
- Stage 1. Shared domain and API types
- Stage 2. App shell and shared layer
- Stage 3. Barrel exports
- Stage 4. Layout and simple UI/pages
- Stage 5. Auth module
- Stage 6. Settings and Profile
- Stage 7. Courses and Home
- Stage 8. Learning module
- Stage 9. Teacher module

Remaining stage:
- Stage 10. Final cleanup and strictness pass

## Current Result

The frontend now runs in mixed-to-full TypeScript mode with the entire main React surface migrated to `ts/tsx`.

Verification after Stage 9:
- `npm.cmd run typecheck` passes
- `npm.cmd run build` passes
- `npm.cmd run lint` passes

## What Stage 9 Added

Teacher pages are now migrated and split around reusable normalization/payload helpers instead of keeping all transformation logic inside page components.

Created:
- `frontend/src/pages/teacher/model/types.ts`
- `frontend/src/pages/teacher/lib/normalize.ts`
- `frontend/src/pages/teacher/lib/payloads.ts`
- `frontend/src/pages/teacher/lib/errors.ts`
- `typescript_migration_stage_9_teacher.md`

Migrated:
- `frontend/src/pages/teacher/ui/TeacherCoursesPage.tsx`
- `frontend/src/pages/teacher/ui/TeacherCourseEditPage.tsx`
- `frontend/src/pages/teacher/ui/TeacherModuleEditPage.tsx`
- `frontend/src/pages/teacher/ui/TeacherTopicEditPage.tsx`

Cleaned up:
- removed obsolete duplicate JSX teacher pages after TSX migration
- kept teacher routes in `frontend/src/app/App.tsx` aligned with typed `user` props

## Notes On Migration Docs

Only these migration docs are intended to remain trackable in git:
- `typescript_migration_progress.md`
- `typescript_migration_stage_5_auth.md`

All later `typescript_migration*.md` files are ignored through `.gitignore`.

## Final Planned Step

Stage 10 should be a cleanup pass:
- remove any temporary loose typing still left in smaller helpers
- review shared types naming and possible splits (`course/question/learning`)
- prune dead code or stale comments if found
- keep build/lint/typecheck green after final pass
