

export const BULK_LAUNCH_STATUS_COLORS: Record<string, string> = {
    activewithreporting: 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))] transition-colors',
    activewithnoreporting: 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))] transition-colors',
    closedwithfurtherreporting: 'bg-[hsl(var(--aepw-blue)/0.1)] border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring font-semibold hover:bg-secondary/80 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] text-[hsl(var(--aepw-blue))] transition-colors',
    closedwithnofurtherreporting: 'transition-colors',
}