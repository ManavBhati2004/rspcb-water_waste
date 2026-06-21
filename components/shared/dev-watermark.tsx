import { DigitalHammerLogo } from "./digital-hammer-logo";

export function DevWatermark() {
  return (
    <div className="fixed bottom-3 right-3 z-[60] flex select-none items-center gap-2 rounded-full border border-black/10 bg-white/85 py-1 pl-1 pr-3 shadow-lg ring-1 ring-black/5 backdrop-blur-md transition-opacity duration-300 hover:opacity-100 sm:opacity-85">
      <DigitalHammerLogo className="h-8 w-8 shrink-0 rounded-full" />
      <div className="leading-tight">
        <p className="text-[11px] font-bold tracking-tight text-slate-800">Digital Hammer</p>
        <p className="text-[9px] font-medium text-slate-500">Developed by Manav Bhati</p>
      </div>
    </div>
  );
}
