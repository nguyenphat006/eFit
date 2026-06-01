export default function WorkoutsLayout({ children }: { children: React.ReactNode }) {
  // Break out of dashboard's padded max-w-7xl container for full-bleed split-pane
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100%+2rem)] sm:h-[calc(100%+3rem)] lg:h-[calc(100%+4rem)] overflow-hidden">
      {children}
    </div>
  );
}
