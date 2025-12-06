"use client";

export function SimpleTest() {
  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "lime",
        color: "black",
        padding: "20px",
        zIndex: 999999,
        fontSize: "16px",
        fontWeight: "bold",
        border: "3px solid black",
      }}
    >
      CLIENT COMPONENT WORKS!
    </div>
  );
}
