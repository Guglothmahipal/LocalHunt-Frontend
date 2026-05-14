import React, { forwardRef, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const UserChat = forwardRef(({ userId, vendorId }, ref) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesRef = useRef(null);

  // Load previous messages
  const loadMessages = async () => {
    if (!userId || !vendorId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${vendorId}),and(sender_id.eq.${vendorId},recipient_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      const formatted = data.map((m) => ({
        id: m.id,
        text: m.message_text,
        sender: m.sender_id === userId ? "user" : "vendor",
        timestamp: m.created_at,
      }));
      setMessages(formatted);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [userId, vendorId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesRef.current?.scrollTo(0, messagesRef.current.scrollHeight);
  }, [messages]);

  // Send message (optimistic with temp-id)
  const sendMessage = async (text) => {
    if (!text.trim() || !userId || !vendorId) return;

    // const tempId = `temp-${Date.now()}`;
    // const tempMsg = {
    //   id: tempId,
    //   text,
    //   sender: "user",
    //   timestamp: new Date().toISOString(),
    // };

    
    // setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    // insert to DB (realtime listener will handle replacing the temp)
    await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: vendorId,
      message_text: text,
      message_type: "text",
      is_read: false,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  // Helper: handle incoming realtime message and dedupe/replace temp
  const handleRealtimeInsert = (msgRow) => {
    // map DB row to local message shape
    const mapped = {
      id: msgRow.id,
      text: msgRow.message_text,
      sender: msgRow.sender_id === userId ? "user" : "vendor",
      timestamp: msgRow.created_at,
    };

    setMessages((prev) => {
  

      // otherwise append normally
      return [...prev, mapped];
    });
  };

  // Real-time subscription
  useEffect(() => {
    if (!userId || !vendorId) return;

    const channel = supabase
      .channel("realtime-user-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === userId && msg.recipient_id === vendorId) ||
            (msg.sender_id === vendorId && msg.recipient_id === userId)
          ) {
            handleRealtimeInsert(msg);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, vendorId]);

  return (
    <div className="d-flex flex-column h-100" style={{ height: "100%" }}>
      <div
        ref={messagesRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          backgroundColor: "#f1f3f5",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
            }}
          >
            <div
              style={{
                backgroundColor: msg.sender === "user" ? "#d1e7dd" : "#e9ecef",
                borderRadius: msg.sender === "user" ? "18px 18px 0 18px" : "18px 18px 18px 0",
                padding: "10px 14px",
                wordBreak: "break-word",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              {msg.text}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6c757d",
                marginTop: "2px",
                textAlign: msg.sender === "user" ? "right" : "left",
              }}
            >
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex align-items-center p-2 bg-white border-top" style={{ gap: "8px", borderTop: "1px solid #dee2e6" }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="form-control"
          style={{ borderRadius: "20px", padding: "10px 15px", fontSize: "0.95rem" }}
        />
        <button
          onClick={() => sendMessage(newMessage)}
          disabled={!newMessage.trim()}
          className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: "42px", height: "42px" }}
        >
          ➤
        </button>
      </div>
    </div>
  );
});

export default UserChat;