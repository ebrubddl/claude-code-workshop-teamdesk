import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  DoorOpen,
  ListTodo,
  type LucideIcon,
  Users,
} from "lucide-react";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: App });

const pages: readonly {
  description: string;
  icon: LucideIcon;
  title: string;
  to: "/team" | "/rooms" | "/bookings" | "/tasks";
}[] = [
  {
    description: "See who is on the team and read the latest announcements.",
    icon: Users,
    title: "Team",
    to: "/team",
  },
  {
    description: "The meeting rooms you can book and how many each seats.",
    icon: DoorOpen,
    title: "Rooms",
    to: "/rooms",
  },
  {
    description: "Book a room for a meeting and keep track of your bookings.",
    icon: CalendarDays,
    title: "Bookings",
    to: "/bookings",
  },
  {
    description: "Shared jobs, who has them, how urgent they are and when.",
    icon: ListTodo,
    title: "Tasks",
    to: "/tasks",
  },
];

function App() {
  return (
    <main className="page-wrap px-4 pt-14 pb-16">
      <section className="rise-in pt-6 pb-4 sm:pt-10">
        <p className="island-kicker mb-4">Your team's front desk</p>
        <h1 className="display-title mb-5 max-w-3xl text-5xl text-foreground leading-[1.05] sm:text-6xl">
          Rooms, bookings and tasks for a small team.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
          One place to book a meeting room, share announcements and keep track
          of who is doing what.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/bookings">Book a room</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/tasks">See tasks</Link>
          </Button>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pages.map(({ description, icon: Icon, title, to }, index) => (
          <Link
            className="rise-in group island-shell flex flex-col gap-3 p-6 no-underline transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            key={title}
            style={{ animationDelay: `${index * 90 + 80}ms` }}
            to={to}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <h2 className="m-0 font-heading text-2xl text-foreground leading-tight">
              {title}
            </h2>
            <p className="m-0 flex-1 text-muted-foreground text-sm">
              {description}
            </p>
            <span className="flex items-center gap-1 font-medium text-primary text-sm">
              Open {title.toLowerCase()}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
