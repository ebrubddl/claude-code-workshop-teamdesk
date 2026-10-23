import type { Room } from "@repo/db/shared";
import { type MouseEvent, useCallback } from "react";
import { Button } from "#/components/ui/button";

interface RoomListProps {
  disabled: boolean;
  onArchive: (roomId: string) => void;
  rooms: readonly Room[];
}

export default function RoomList({
  disabled,
  onArchive,
  rooms,
}: RoomListProps) {
  const handleArchive = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      onArchive(event.currentTarget.value),
    [onArchive]
  );

  if (rooms.length === 0) {
    return (
      <p className="glass px-5 py-4 text-foreground/60 text-sm [--glass-radius:22px]">
        No rooms yet.
      </p>
    );
  }
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {rooms.map((room) => (
        <li
          className="glass flex items-center justify-between gap-4 p-4 [--glass-radius:22px]"
          key={room.id}
        >
          <div>
            <p className="m-0 font-semibold text-foreground">{room.name}</p>
            <p className="m-0 text-muted-foreground text-sm">
              Seats {room.capacity}
            </p>
          </div>
          <Button
            disabled={disabled}
            onClick={handleArchive}
            size="sm"
            value={room.id}
            variant="outline"
          >
            Archive
          </Button>
        </li>
      ))}
    </ul>
  );
}
