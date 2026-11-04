# eFit Frontend UI/UX Guidelines

## Styling & Components
- **Consistency with Nutrition Page**: The `NutritionLibraryPage` serves as the baseline for UI/UX design (colors, sizing, padding, and border-radius).
- **Border Radius**: Stick to Shadcn UI's standard sizing or Tailwind's standard scales (`rounded-lg`, `rounded-xl`, `rounded-2xl`). Avoid exaggerated custom radii like `rounded-[2.5rem]` or `rounded-[3rem]` unless explicitly requested for a highly specific marketing component.
- **Card Design**: Use standard `<Card>` components with `shadow-sm` or `shadow-md`. Avoid overly heavy or custom shadows unless necessary.
- **Headers & Typography**: Use `text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent` for page headers, matching the Nutrition page.
- **Buttons**: Use standard Shadcn sizing (e.g., `size="default"`, `size="sm"`) rather than heavily custom paddings (`px-8 py-7 h-auto`). Primary action buttons use `bg-[#54B7F0] hover:bg-[#3FA3DC] text-white`.
- **Backgrounds**: Main workspace areas should use `bg-slate-50/30`, `bg-slate-50/40`, or `bg-slate-50/50`. Modals should use `bg-white` or `bg-slate-50`.

## Shared Components & Patterns
- **Data Display**: Always use the shared `<DataTable />` component for lists and tables to ensure consistent pagination, loading states, and empty states.
- **Actions & Feedback**: Use `<ConfirmDeleteDialog />` for all deletion confirmations. Never use native browser `confirm()`.
- **Form Patterns**: Prefer `Sheet` (Drawer) for metadata creation and Fullscreen `Dialog` for complex workspace environments (Excel-like).
