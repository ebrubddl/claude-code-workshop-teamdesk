import type { Booking } from "@repo/db/shared";
import BookingCard from "./BookingCard";

interface BookingListProps {
  bookings: readonly Booking[];
  describe: (booking: Booking) => string;
  disabled: boolean;
  emptyText: string;
  onCancel: (bookingId: string) => void;
}

export default function BookingList({
  bookings,
  describe,
  disabled,
  emptyText,
  onCancel,
}: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <p className="glass px-5 py-4 text-foreground/60 text-sm [--glass-radius:22px]">
        {emptyText}
      </p>
    );
  }
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {bookings.map((booking) => (
        <BookingCard
          booking={booking}
          detail={describe(booking)}
          disabled={disabled}
          key={booking.id}
          onCancel={onCancel}
        />
      ))}
    </ul>
  );
}
