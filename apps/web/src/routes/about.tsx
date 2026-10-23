import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="glass max-w-3xl p-8 sm:p-10">
        <p className="island-kicker mb-3">About</p>
        <h1 className="display-title mb-4 text-5xl text-foreground sm:text-6xl">
          A small starter with room to grow.
        </h1>
        <p className="m-0 max-w-3xl text-foreground/70 text-lg leading-relaxed">
          TanStack Start gives you type-safe routing, server functions, and
          modern SSR defaults. Use this as a clean foundation, then layer in
          your own routes, styling, and add-ons.
        </p>
      </section>
    </main>
  );
}
