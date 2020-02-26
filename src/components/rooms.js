import React from "react";

export default function Rooms({ rooms, roomenter }) {
  return (
    <>
      <h2>Rooms (showing first 10)</h2>
      <div>
        {rooms.map((r, i) => (
          <button key={i} onClick={() => roomenter(r.roomnumber)}>
            [{r.roomnumber}]<br />
            {r.players} players
            <br />${r.bank}
            <br />
            {r.status}
          </button>
        ))}
      </div>
    </>
  );
}
