# Stage 6. Settings and Profile Migration

This note focuses only on the Stage 6 TypeScript migration for the settings and profile area.

## Files migrated

Converted from JS/JSX to TS/TSX:
- `frontend/src/pages/settings/ui/SettingsPage.tsx`
- `frontend/src/pages/settings/ui/components/SettingsNav.tsx`
- `frontend/src/pages/settings/ui/components/SettingsLanguageSection.tsx`
- `frontend/src/pages/settings/ui/components/SettingsThemeSection.tsx`
- `frontend/src/pages/settings/ui/components/SettingsAccountSection.tsx`
- `frontend/src/pages/profile/ui/ProfilePage.tsx`
- `frontend/src/pages/profile/ui/components/ProfileInfo.tsx`
- `frontend/src/pages/profile/ui/components/ProfileCustomization.tsx`
- `frontend/src/pages/profile/ui/profileBackgrounds.ts`

Created:
- `frontend/src/pages/settings/model/types.ts`
- `frontend/src/pages/profile/model/types.ts`

Updated:
- `frontend/src/app/App.tsx`

## What was changed in code

### 1. Added page-local type layers

`frontend/src/pages/settings/model/types.ts` now contains:
- `SettingsPageProps`
- `SettingsSectionKey`
- `SettingsNavProps`
- `SocialConnectionsResponse`
- `SocialProvider`

`frontend/src/pages/profile/model/types.ts` now contains:
- `ProfilePageProps`
- `ProfileFormValues`
- `ProfileGradient`
- `ProfileGradientChoice`
- `ProfileInfoProps`
- `ProfileCustomizationProps`

This keeps page-specific prop contracts close to the pages that own them instead of overloading the shared global type folder.

### 2. Migrated the settings page group

`SettingsPage.tsx`
- typed the `activeSection` state
- used `satisfies Record<SettingsSectionKey, string>` for section IDs
- typed section navigation callback

`SettingsNav.tsx`
- typed nav item keys and `onChange`

`SettingsLanguageSection.tsx`
- moved to TSX without behavior changes

`SettingsThemeSection.tsx`
- moved to TSX
- kept the existing theme switching logic
- replaced broken encoded icon glyphs with safe text labels

`SettingsAccountSection.tsx`
- typed social connection response data
- typed current-user refresh response
- typed provider connect/disconnect handlers
- typed Google callback payloads and auth session handoff
- moved API error handling to `unknown` plus `isAxiosError<ApiErrorResponse>`

### 3. Migrated the profile page group

`profileBackgrounds.ts`
- moved the gradient catalog into a typed file
- typed gradients as `ProfileGradient[]`

`ProfilePage.tsx`
- typed page props, form state, avatar state, success/error state, and gradient state
- added typed helpers for building form state and resolving avatar URLs
- narrowed `FileReader.result` before assigning avatar preview
- typed multipart profile patch responses as `User`
- normalized backend error extraction through typed helpers
- removed the old unused `totalGradientPages` value

`ProfileInfo.tsx`
- received a dedicated prop interface
- now has typed input and action handlers

`ProfileCustomization.tsx`
- received a dedicated prop interface
- typed avatar input ref, gradient options, and save/cancel handlers
- replaced broken encoded button glyphs with safe ASCII labels

### 4. Tightened authenticated route typing in App

`frontend/src/app/App.tsx`
- `ProfilePage` and `SettingsPage` now receive `user!` inside the authenticated route branch

This is only a TypeScript narrowing change. Runtime behavior is unchanged because those routes already render only when a user exists.

## What changed structurally

Before this stage:
- settings/profile worked, but relied on implicit prop shapes and loosely typed multipart/profile update flows

After this stage:
- account-facing pages have local type contracts
- settings and profile now reuse the shared `User` model consistently
- file uploads and profile appearance updates are safer to refactor later
- these screens are in better shape for a later MUI migration

## Validation after the stage

Checks run:
- `npm run typecheck` -> passes
- `npm run build` -> passes
- `npm run lint` -> still fails only in later modules outside this stage

Current lint failures are in:
- courses
- learning
- teacher

## Suggested commit

`migrate settings and profile pages to typescript`
