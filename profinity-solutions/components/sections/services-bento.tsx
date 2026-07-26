import { GlowCard } from '@/components/ui/glow-card';
import { SERVICES } from '@/lib/site-config';

// Asymmetric bento grid for the six services (glow tracks the cursor).
const AREAS = [
  'md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]',
  'md:[grid-area:1/7/2/13] xl:[grid-area:1/5/2/9]',
  'md:[grid-area:2/1/3/7] xl:[grid-area:1/9/2/13]',
  'md:[grid-area:2/7/3/13] xl:[grid-area:2/1/3/5]',
  'md:[grid-area:3/1/4/7] xl:[grid-area:2/5/3/9]',
  'md:[grid-area:3/7/4/13] xl:[grid-area:2/9/3/13]',
];

export function ServicesBento() {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-3 xl:grid-rows-2">
      {SERVICES.map((s, i) => {
        const Icon = s.icon;
        return (
          <GlowCard
            key={s.id}
            area={AREAS[i]}
            icon={<Icon className="h-5 w-5" />}
            title={s.name}
            description={s.short}
            href={`/services/${s.slug}`}
          />
        );
      })}
    </ul>
  );
}
