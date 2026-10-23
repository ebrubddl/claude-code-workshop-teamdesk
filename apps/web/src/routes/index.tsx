import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  DoorOpen,
  ListTodo,
  type LucideIcon,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: App });

interface Feature {
  className: string;
  description: string;
  detail?: ReactNode;
  icon: LucideIcon;
  tint: string;
  title: string;
  to: "/team" | "/rooms" | "/bookings" | "/tasks";
}

const PRIORITY_CHIPS = [
  { className: "bg-sky-500/15 text-sky-800 dark:text-sky-200", label: "Low" },
  {
    className: "bg-amber-500/20 text-amber-900 dark:text-amber-200",
    label: "Medium",
  },
  { className: "bg-red-500/15 text-red-800 dark:text-red-200", label: "High" },
] as const;

const features: readonly Feature[] = [
  {
    className: "lg:col-span-2",
    description:
      "Shared jobs, who has them and when they are due. Mark what is urgent and filter the list down to what matters.",
    detail: (
      <div className="mt-2 flex flex-wrap gap-2">
        {PRIORITY_CHIPS.map(({ className, label }) => (
          <span
            className={`rounded-full px-3 py-1 font-semibold text-xs ${className}`}
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
    ),
    icon: ListTodo,
    tint: "from-[#0a84ff] to-[#5e5ce6]",
    title: "Tasks",
    to: "/tasks",
  },
  {
    className: "",
    description: "Book a room and keep track of your bookings.",
    icon: CalendarDays,
    tint: "from-[#ff9f0a] to-[#ff453a]",
    title: "Bookings",
    to: "/bookings",
  },
  {
    className: "",
    description: "The meeting rooms you can book and how many each seats.",
    icon: DoorOpen,
    tint: "from-[#30d158] to-[#00b8a9]",
    title: "Rooms",
    to: "/rooms",
  },
  {
    className: "lg:col-span-2",
    description: "See who is on the team and read the latest announcements.",
    icon: Users,
    tint: "from-[#bf5af2] to-[#ff375f]",
    title: "Team",
    to: "/team",
  },
];

function App() {
  return (
    <main className="page-wrap px-4 pt-16 pb-16 sm:pt-24">
      <section className="rise-in mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-medium text-foreground/80 text-sm [--glass-radius:999px]">
          <span className="size-2 rounded-full bg-primary" />
          Your team's front desk
        </p>
        <h1 className="glass-title mb-6 text-5xl text-foreground sm:text-7xl">
          Rooms, bookings and tasks for a{" "}
          <span className="glass-gradient-text">small team.</span>
        </h1>
        <p className="mb-10 max-w-xl text-foreground/70 text-lg leading-relaxed sm:text-xl">
          One place to book a meeting room, share announcements and keep track
          of who is doing what.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="h-11 px-6 text-base" size="lg">
            <Link to="/bookings">Book a room</Link>
          </Button>
          <Button
            asChild
            className="h-11 px-6 text-base"
            size="lg"
            variant="outline"
          >
            <Link to="/tasks">See tasks</Link>
          </Button>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(
          (
            { className, description, detail, icon: Icon, tint, title, to },
            index
          ) => (
            <Link
              className={`rise-in glass glass-lift group flex flex-col gap-3 p-7 no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${className}`}
              key={title}
              style={{ animationDelay: `${index * 90 + 120}ms` }}
              to={to}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`flex size-12 items-center justify-center rounded-[14px] bg-gradient-to-br text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(0,0,0,0.35)] ${tint}`}
                >
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-5 text-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                />
              </div>
              <h2 className="m-0 mt-4 font-semibold text-2xl text-foreground tracking-tight">
                {title}
              </h2>
              <p className="m-0 max-w-md text-foreground/65 text-sm leading-relaxed">
                {description}
              </p>
              {detail}
            </Link>
          )
        )}
      </section>
    </main>
  );
}
