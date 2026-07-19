import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Find a Ride", href: "/rides/find" },
      { label: "Offer a Ride", href: "/rides/offer" },
      { label: "Pricing", href: "/#features" },
      { label: "Enterprise", href: "/#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/#about" },
      { label: "How it Works", href: "/#how-it-works" },
      { label: "Register Org", href: "/organizations/register" },
      { label: "Contact", href: "/#about" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/#about" },
      { label: "Safety", href: "/#features" },
      { label: "Guides", href: "/#how-it-works" },
      { label: "Support", href: "/#about" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-4 lg:col-span-2">
          <span className="text-lg font-bold text-zinc-900">
            Commute<span className="text-emerald-600">Share</span>
          </span>
          <p className="max-w-xs text-sm text-zinc-500">
            Share rides, save costs, and meet your community on your daily journey.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-zinc-900">{col.title}</h3>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-zinc-500 hover:text-emerald-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-100">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} CommuteShare. Enterprise carpooling for registered
            organizations.
          </p>
        </div>
      </div>
    </footer>
  );
}
