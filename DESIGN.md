# DESIGN.md: Tailgrids File Manager Dashboard (Cloned Design System)

## Source
- URL: https://filemanager.demos.tailgrids.com/
- Capture date: 2026-09-11
- Evidence: Firecrawl scrape branding JSON, markdown hierarchy, component metadata, full-page screenshot (`.firecrawl/tailgrids-screenshot.png`)

## Reference Screenshot
![Full-page screenshot of Tailgrids File Manager](./.firecrawl/tailgrids-screenshot.png)

Use this screenshot as the visual source of truth for layout, hierarchy, density, and feel. Tokens below describe the same dashboard in machine-readable form.

## Design Summary
Tailgrids File Manager is a clean, modern, white-first SaaS dashboard designed specifically for cloud storage, file exploring, and asset collaboration. It employs a pure white canvas (`#FFFFFF`) and soft gray accents (`#F9FAFB`, `#F3F4F6`), subtle 1px divider lines (`#E5E7EB`), crisp typography in DM Sans/Inter, and a signature Tailgrids Cobalt Blue accent (`#3758F9`). Key layout components include a dedicated user profile card at the top of the sidebar, grouped `MENU` and `ALL FOLDER` lists, an embedded `Upgrade Storage` progress widget, a header with a large global search input and a prominent `+ Upload File` primary CTA, a signature multi-color segmented `Total Storage` capacity card, a horizontal grid of `Recent files` with file-type badges, amber folder cards, and an activity tracking table.

## Design Tokens

### Colors
- **Canvas & Backgrounds**:
  - `bg-canvas`: `#FFFFFF` / `#F9FAFB`
  - `bg-card`: `#FFFFFF`
  - `bg-sidebar`: `#FFFFFF` (bordered with `#E5E7EB`)
  - `bg-subtle`: `#F3F4F6` / `#F9FAFB`
  - `bg-input`: `#F9FAFB`
- **Borders & Dividers**:
  - `border-main`: `#E5E7EB` (clean 1px structural borders)
  - `border-subtle`: `#F3F4F6`
- **Typography & Text**:
  - `text-heading`: `#111827` / `#1F2937` (dark slate for titles and metrics)
  - `text-body`: `#374151` / `#4B5563`
  - `text-muted`: `#6B7280` / `#9CA3AF`
  - `text-brand`: `#3758F9`
- **Accents & Categories**:
  - `primary`: `#3758F9` (Tailgrids signature cobalt blue)
  - `accent-document`: `#3758F9` (blue)
  - `accent-image`: `#8B5CF6` (purple)
  - `accent-video`: `#F59E0B` (amber)
  - `accent-audio`: `#10B981` (emerald green)
  - `accent-free`: `#E5E7EB` (neutral gray)

### Typography
- **Headings Font Stack**: `DM Sans`, `Inter`, ui-sans-serif, system-ui, sans-serif
- **Body Font Stack**: `DM Sans`, `Inter`, ui-sans-serif, system-ui, sans-serif
- **Monospace Font Stack**: `JetBrains Mono`, `Geist Mono`, monospace
- **Scale & Weights**:
  - `Storage Metric`: `text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111827]`
  - `Section Header`: `text-base sm:text-lg font-bold text-[#111827]`
  - `Sidebar Section Title`: `text-[11px] font-bold uppercase tracking-wider text-slate-400`
  - `Body / Descriptions`: `text-xs sm:text-sm text-slate-600`

### Spacing And Layout
- **Sidebar**: Fixed `250px` width, pure white background `#FFFFFF`, border-r `#E5E7EB`.
- **Top Header**: Height `68px`, border-b `#E5E7EB`, with search bar, notification, and `+ Upload File` button.
- **Card Radius**: `rounded-2xl` (16px) or `rounded-xl` (12px).
- **Shadows**: Clean, subtle micro-shadows `shadow-xs` / `shadow-sm`.

## Components

### 1. Left Sidebar (`sidebar.tsx`)
- Top: Brand logo (`Creative Drive` with official logo mark).
- Below Logo: User Profile Card (Avatar + Name + Role `Manager/Owner`).
- Navigation Groups:
  - `MENU`: Overview, My Files, Shared Files, Transfer, Recent, Settings.
  - `ALL FOLDER`: Recent folders list + `+ Create New Folder` action.
- Bottom Widget: `Upgrade Storage` card with used quota, horizontal progress bar, and `Upgrade Plan` button.

### 2. Header (`header.tsx`)
- Search input with placeholder: `Search Files, doc, image...` + `⌘K` shortcut badge.
- Right: Notification bell + Primary Action Button: `+ Upload File` (`bg-[#3758F9] text-white`).

### 3. Total Storage Segmented Bar Card (`TotalStorageBar`)
- Top row:
  - Left: `Total Storage` heading and large `80.11 GB used` stat.
  - Right: `From 100 GB` capacity label.
- Center: Multi-color segmented progress bar showing distribution of:
  - Document (blue), Image (purple), Video (amber), Audio (green), Free Space (gray).
- Bottom row: Legend pills with colored indicators.

### 4. Recent Files Section
- Cards grid showing file type icon, file name, size, and relative timestamp (`404 KB • 2 hours ago`).

### 5. Folders Grid
- Amber folder cards showing folder name, file count, and aggregated size (`16 files • 177MB`).

### 6. Cloud Providers Section
- Storage overview cards for Google Drive, Dropbox, OneDrive, MEGA, and pCloud with official logos, used quota, and active connection status.

## Agent Build Instructions
1. Update `globals.css` with Tailgrids clean theme tokens (`--color-primary: #3758F9`, `--color-canvas: #F9FAFB`, `--color-line: #E5E7EB`, `--color-ink: #111827`).
2. Redesign `sidebar.tsx`: add the user profile block below the logo, grouped `MENU` and `ALL FOLDER`, and the `Upgrade Storage` card with progress bar at bottom.
3. Redesign `header.tsx`: include the Tailgrids search bar (`Search Files, doc, image...`) and the prominent `+ Upload File` button.
4. Redesign `dashboard-view.tsx` with the signature `Total Storage` multi-color segmented bar card, `Recent files` grid, `Folder` cards, and `Cloud Storages` overview.
5. Ensure full functionality is preserved (all modals, upload panel, cloud connections, and transfers).

## Rerun Inputs
workflow: firecrawl-website-design-clone
source_url: https://filemanager.demos.tailgrids.com/
target_stack: Next.js 15, Tailwind CSS, TypeScript
output: DESIGN.md
