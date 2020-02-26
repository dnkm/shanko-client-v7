import React, { useContext, useState, useEffect, Component } from "react";
import UserContext from "../UserContext";

// TODO: make io context

// sid: 3
// seatIndex: 1
// nickname: "dnkm"
// balance: 100000
// imgnumber: 1
// gender: 0
// isReady: false
// isPlaying: false
// cards: Array[0]
// bet: 0

const PHASES = [
  { phase: "waiting", anims: ["ready"] },
  { phase: "betting", anims: ["bet"] },
  { phase: "deal", anims: ["deal"] },
  { phase: "player phase", anims: ["player action"] },
  { phase: "three card", anims: ["three card"] },
  { phase: "banker phase", anims: ["banker action"] },
  { phase: "results", anims: ["results"] }
];

// betting phase
function PlayerPhase1({ player, isBanker }) {
  const { io } = useContext(UserContext);
  function placeBet(betAmount) {
    io.emit2("sresp_ingame_place_bet", {
      betAmount,
      coins: {
        "10": betAmount / 10
      }
    });
  }

  if (isBanker) return <div className="box">you are the banker</div>;

  if (player.bet > 0) {
    return <div>[WAITING]</div>;
  }

  return (
    <div className="box">
      {[10, 100, 200].map(v => (
        <button key={v} onClick={() => placeBet(v)}>
          {v}
        </button>
      ))}
    </div>
  );
}

// waiting phase
function PlayerPhase0({ player, isPlayer, isBanker, roomleave }) {
  return <>{isPlayer && <button onClick={roomleave}>Leave</button>}</>;
}

// player phase
function PlayerPhase3({ isBanker }) {
  const { io } = useContext(UserContext);
  let [done, setDone] = useState(false);

  function takeAction(action) {
    io.emit2("sresp_ingame_player_action", { action });
    setDone(true);
  }

  if (done) return <p>Waiting other players....</p>;
  return (
    <>
      <button onClick={() => takeAction("draw")}>DRAW</button>
      <button onClick={() => takeAction("pass")}>PASS</button>
    </>
  );
}

// banker phase
function PlayerPhase4({}) {
  const { io } = useContext(UserContext);
  let [used3, setUsed3] = useState(false);

  function takeAction(action) {
    if (action === "3") {
      io.emit2("sresp_ingame_three_card", { threecard: true });
      setUsed3(true);
    } else io.emit2("sresp_ingame_banker_action", { action });
  }

  return (
    <>
      {!used3 && <button onClick={() => takeAction("3")}>3 Card</button>}
      <button onClick={() => takeAction("draw")}>DRAW</button>
      <button onClick={() => takeAction("pass")}>PASS</button>
    </>
  );
}

function PlayerPhase6() {
  const { io } = useContext(UserContext);
  let [sent, setSent] = useState(false);

  function finish() {
    io.emit2("sresp_ingame_result");
    setSent(true);
  }

  if (sent) return <div>waiting for other players...</div>;

  return <button onClick={finish}>FINISH</button>;
}

function Player({ player, isBanker, isPlayer, roomleave, room }) {
  return (
    <div className="player box">
      <div>
        [{player.sid}] {player.nickname}
        {isBanker && <span className="label">BANKER</span>}
        {isPlayer && <span className="label">PLAYER</span>}
      </div>

      <div>${player.balance}</div>
      <div>{player.isPlaying ? "Playing" : "NOT Playing"}</div>
      <div>BET: ${player.bet}</div>
      {room.phaseIndex === 0 && (
        <PlayerPhase0
          player={player}
          isPlayer={isPlayer}
          isBanker={isBanker}
          roomleave={roomleave}
        />
      )}
      {room.phaseIndex === 1 && isPlayer && !isBanker && (
        <PlayerPhase1 player={player} />
      )}
      {room.phaseIndex === 3 && isPlayer && !isBanker && (
        <PlayerPhase3 player={player} />
      )}
      {(room.phaseIndex === 4 || room.phaseIndex === 5) &&
        isPlayer &&
        isBanker && <PlayerPhase4 player={player} />}
      {room.phaseIndex === 6 && isPlayer && <PlayerPhase6 />}

      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly"
        }}
      >
        {player.cards.map((card, i) => (
          <div key={i} className="card box">
            {(() => {
              switch (card.img) {
                case "DIAMONDS":
                  return "♦️";
                case "HEARTS":
                  return "♥️";
                case "SPADES":
                  return "♠️";
                case "CLUBS":
                  return "♣️";
                default:
                  return "🃏";
              }
            })()}
            {card.num}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Room({ roomInit, roomleave }) {
  let [sitted, setSitted] = useState(false);
  let [room, setRoom] = useState(roomInit);
  const { io, sid } = useContext(UserContext);

  useEffect(() => {
    console.log("room", room);
    io.emit2("rqst_ingame_imready");

    io.on("resp_ingame_imready", data => {
      console.log("resp_ingame_imready", data);

      // check if you are already sitted (resume)
      data.players.forEach(p => {
        if (p === null) return;
        if (p.sid === sid) setSitted(true);
      });
    });

    io.on("resp_ingame_sit", data => {
      console.log("resp_ingame_sit", data);
      setRoom(room => ({ ...room, ...data }));
      setSitted(true);
    });

    io.on("srqst_ingame_newuser", data => {
      console.log("srqst_ingame_newuser", data);
      io.emit2("rqst_ingame_state"); // TODO needs piggyback
    });

    io.on("resp_ingame_state", data => {
      console.log("resp_ingame_state", data);
      setRoom(room => ({ ...room, ...data }));
    });

    io.on("srqst_ingame_place_bet", data => {
      console.log("srqst_ingame_place_bet", data);
      setRoom(room => ({ ...room, ...data }));
    });

    io.on("srqst_ingame_deal", data => {
      console.log("srqst_ingame_deal", data);
      io.emit2("sresp_ingame_deal");
      setRoom(room => ({ ...room, ...data }));
    });

    io.on("srqst_ingame_player_action", data => {
      console.log("srqst_ingame_player_action", data);
      setRoom(room => ({ ...room, ...data }));
    });

    io.on("srqst_ingame_player_action_update", data => {
      console.log("srqst_ingame_player_action_update", data);
      setRoom(room => ({ ...room, ...data }));

      io.emit2("sresp_ingame_player_action_update");
    });

    io.on("srqst_ingame_three_card", data => {
      console.log("srqst_ingame_three_card", data);
      // ignore
    });

    io.on("srqst_ingame_three_cards", data => {
      console.log("srqst_ingame_three_cards", data);
      setRoom(room => ({ ...room, ...data }));
      io.emit2("sresp_ingame_three_cards");
    });

    io.on("srqst_ingame_banker_action", data =>
      console.log("srqst_ingame_banker_action", data)
    );

    io.on("srqst_ingame_banker_action_update", data => {
      console.log("srqst_ingame_banker_action_update", data);
      setRoom(room => ({ ...room, ...data }));
    });

    io.on("srqst_ingame_result", data => {
      console.log("srqst_ingame_result", data);
      setRoom(room => ({ ...room, ...data }));
    });

    io.on("resp_room_leave", data => {
      console.log("resp_room_leave", data);
      if (data.sid !== sid) setRoom(room => ({ ...room, ...data }));
    });
    return function cleanUp() {
      io.off("resp_ingame_imready");

      io.off("resp_ingame_sit");

      io.off("srqst_ingame_newuser");

      io.off("resp_ingame_state");

      io.off("srqst_ingame_place_bet");

      io.off("srqst_ingame_deal");

      io.off("srqst_ingame_player_action");

      io.off("srqst_ingame_player_action_update");

      io.off("srqst_ingame_three_card");

      io.off("srqst_ingame_three_cards");

      io.off("srqst_ingame_banker_action");

      io.off("srqst_ingame_banker_action_update");

      io.off("resp_room_leave");
    };
  }, []);

  function sit(seatIndex) {
    io.emit2("rqst_ingame_sit", { seatIndex });
  }

  if (!room) return <div>loading....</div>;

  return (
    <div className="room">
      <h3>Room: {room.roomnumber}</h3>
      <table className="table1">
        <thead>
          <tr>
            <th>Min. Bank</th>
            <th>Bank</th>
            <th>Warning</th>
            <th>Deck</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{room.minimumbank}</td>
            <td>{room.bank}</td>
            <td>{room.warning}</td>
            <td>{room.deck} cards</td>
          </tr>
        </tbody>
      </table>
      <div className="phases">
        {PHASES.map((p, i) => (
          <div key={i} className={room.phaseIndex === i ? "active" : ""}>
            ({i}) {p.phase}
          </div>
        ))}
      </div>
      <div className="players">
        {room.players.map((p, i) => {
          if (p == null)
            return (
              <div key={i} className="player box">
                <div>Empty</div>
                {!sitted && <button onClick={() => sit(i)}>Sit</button>}
              </div>
            );
          else
            return (
              <Player
                key={i}
                player={p}
                isBanker={room.bankerIndex === p.sid}
                isPlayer={p.sid === sid}
                roomleave={roomleave}
                room={room}
              />
            );
        })}
      </div>
    </div>
  );
}
