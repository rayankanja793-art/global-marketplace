
const categories = [
  { icon: "ðŸ ", name: "Home Services", description: "Repairs, cleaning and maintenance" },
  { icon: "ðŸ’‡", name: "Beauty & Wellness", description: "Salons, spas and personal care" },
  { icon: "ðŸš—", name: "Automotive", description: "Mechanics, car wash and repairs" },
  { icon: "ðŸŽ‰", name: "Events", description: "Planning, photography and catering" },
  { icon: "ðŸ“š", name: "Education", description: "Tutors, training and lessons" },
  { icon: "ðŸ’¼", name: "Professional Services", description: "Business and expert services" }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-3">
  <img
    src="/global-servicemarket-logo.png"
    alt="Global-ServiceMarket"
    className="h-14 w-auto object-contain"
  />
</a>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#categories" className="hover:text-blue-700">Explore services</a>
            <a href="#how-it-works" className="hover:text-blue-700">How it works</a>
            <a href="#providers" className="hover:text-blue-700">Become a provider</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-100 sm:block">
              Sign in
            </button>
            <button className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
              Get started
            </button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 px-6 py-24 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <span className="mb-6 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
            Discover services. Connect with professionals.
          </span>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Find the right service.
            <span className="block text-blue-300">Make life easier.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            Discover skilled professionals and businesses, compare services
            and prices, and book with confidence.
          </p>

          <div className="mx-auto mt-10 grid max-w-4xl gap-3 rounded-2xl bg-white p-3 text-left shadow-2xl md:grid-cols-[1fr_1fr_auto]">
            <label className="flex flex-col px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                What service do you need?
              </span>
              <input
                type="text"
                placeholder="e.g. Plumber, barber, tutor..."
                className="mt-2 w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="flex flex-col border-slate-200 px-4 py-2 md:border-l">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Where do you need it?
              </span>
              <input
                type="text"
                placeholder="Enter town or neighbourhood"
                className="mt-2 w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <button className="rounded-xl bg-blue-700 px-8 py-4 font-semibold text-white hover:bg-blue-800">
              Search services
            </button>
          </div>

          <p className="mt-5 text-sm text-blue-200">
            Browse services across Kenya
          </p>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-semibold text-blue-700">EXPLORE THE MARKETPLACE</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Browse service categories
            </h2>
            <p className="mt-3 text-slate-500">
              Find the services you need, all in one place.
            </p>
          </div>
          <a href="#categories" className="font-semibold text-blue-700 hover:underline">
            Explore all categories â†’
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.name}
              className="group rounded-2xl border border-slate-200 p-7 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl">
                {category.icon}
              </div>
              <h3 className="text-lg font-bold">{category.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {category.description}
              </p>
              <span className="mt-5 inline-block font-semibold text-blue-700">
                Explore category â†’
              </span>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-semibold text-blue-700">SIMPLE AND CONVENIENT</p>
            <h2 className="mt-2 text-3xl font-bold">How it works</h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ["01", "Discover", "Search and explore available service providers near your chosen location."],
              ["02", "Compare and book", "Compare services, prices and reviews, then request or make a booking."],
              ["03", "Get it done", "Connect with your provider and follow your booking through completion."]
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-2xl bg-white p-8 shadow-sm">
                <span className="text-3xl font-extrabold text-blue-200">{number}</span>
                <h3 className="mt-4 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="providers" className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-blue-950 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-bold">
            Grow your business with us
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-200">
            Connect with customers, showcase your services, manage bookings
            and grow your business through our marketplace.
          </p>
          <button className="mt-8 rounded-xl bg-white px-7 py-3.5 font-bold text-blue-950 hover:bg-blue-50">
            Become a provider
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 text-sm text-slate-500">
          <p>Â© 2026 ServiceMarket. All rights reserved.</p>
          <p>Discover. Connect. Book.</p>
        </div>
      </footer>
    </main>
  );
}


