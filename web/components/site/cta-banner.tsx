import Link from 'next/link';

type CTABannerProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function CTABanner({
  title,
  description,
  ctaLabel = 'Start a project',
  ctaHref = '/contact',
}: CTABannerProps) {
  return (
    <section className="border-t border-white/10 bg-background px-6 py-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-bold text-white md:text-4xl">{title}</h2>
        <p className="max-w-xl text-neutral-300">{description}</p>
        <Link
          href={ctaHref}
          className="rounded-full bg-white px-6 py-3 text-sm font-medium text-[#020c45] transition-colors hover:bg-neutral-200"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
