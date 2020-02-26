import React, { useContext } from "react";
import UserContext from "../UserContext";

const users = ["test00", "daniel", "jay"];

export default function Login({ doLogin }) {
  const { io } = useContext(UserContext);
  return (
    <>
      <h2>Login as...</h2>
      {users.map(u => (
        <button key={u} onClick={() => doLogin(u)}>
          {u}
        </button>
      ))}

      <hr />
      <button
        onClick={() => {
          io.emit("server_reset");
        }}
      >
        RESET SERVER
      </button>
    </>
  );
}
