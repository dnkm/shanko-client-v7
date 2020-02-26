import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import ioclient from "socket.io-client";

import "./styles.scss";
import Login from "./components/login";
import Rooms from "./components/rooms";
import Room from "./components/room";
import UserContext from "./UserContext";

const endpoint = `https://qq28z.sse.codesandbox.io/`;
const serversandbox = "https://codesandbox.io/s/qq28z";

// phases
// -1 : before login
// 0: logged in
// 1: entered room

function App() {
  let [io, setIo] = useState(undefined);
  let [phase, setPhase] = useState(-1);
  let [sid, setSid] = useState(undefined);
  let [rooms, setRooms] = useState([]);
  let [room, setRoom] = useState(undefined);

  useEffect(() => {
    const io = ioclient(endpoint);
    io.emit2 = function(method, payload = {}) {
      console.log(method, payload);
      this.emit(method, payload);
    };
    setIo(io);
  }, []);

  useEffect(() => {
    if (!io) return;

    io.on("resp_login", data => {
      console.log("resp_login", data);
      console.log("my SID: ", data.sid);
      if (data.retcode === 0) {
        setSid(data.sid);
        setPhase(0);
      }
    });
    return () => io.off("resp_login");
  }, [io]);

  useEffect(() => {
    if (!sid) return;

    io.on("resp_rooms", data => {
      console.log("resp_rooms", data);
      setRooms(data.roomlist.slice(0, 10));
    });

    io.on("resp_room_enter", data => {
      console.log("resp_room_enter", data);
      if (data.retcode === 0) {
        setRoom(data);
        setPhase(1);
      }
    });

    io.on("resp_room_leave", data => {
      console.log("resp_room_leave", data);
      console.log(phase, data.sid, sid);
      if (data.sid === sid) setPhase(0);
    });

    return () => {
      io.ofF("resp_rooms");
      io.off("resp_room_enter");
      io.off("resp_room_leave");
    };
  }, [sid]);

  useEffect(() => {
    switch (phase) {
      case 0:
        io.emit("rqst_rooms");
        return;
      default:
        return;
    }
  }, [phase]);

  function emit(method, payload = {}) {
    console.log(method, payload);
    io.emit(method, payload);
  }

  function doLogin(id) {
    emit("rqst_login", { id, password: "0000" });
    // setId(id);
  }

  function roomenter(roomnumber) {
    emit("rqst_room_enter", { roomnumber });
  }

  function roomleave() {
    emit("rqst_room_leave");
  }

  if (!io) return <div>Connecting....</div>;

  return (
    <UserContext.Provider value={{ io, sid }}>
      <div className="App">
        <h1>Shanko Dummy Client v7 (sid: {sid})</h1>
        {(() => {
          switch (phase) {
            case -1:
              return <Login doLogin={doLogin} />;
            case 0:
              return <Rooms rooms={rooms} roomenter={roomenter} />;
            case 1:
              return <Room roomInit={room} roomleave={roomleave} />;
            default:
              return <div>...</div>;
          }
        })()}
      </div>
    </UserContext.Provider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
