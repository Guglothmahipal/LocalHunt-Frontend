import React, { useState, useEffect, useRef } from "react";
import styles from "./VendorChat.module.css";
import { IoClose } from "react-icons/io5";
import { supabase } from "../../../supabaseClient";

const VendorChat = ({ vendorId, isOpen, onClose, onNewMessage }) => {
  const [userList, setUserList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch chat list
  useEffect(() => {
    if (!isOpen) return;
    const fetchChats = async () => {
      const { data: msgData } = await supabase
        .from("messages")
        .select("*")
        .or(`recipient_id.eq.${vendorId},sender_id.eq.${vendorId}`)
        .order("created_at", { ascending: false });

      const chats = {};
      msgData?.forEach((msg) => {
        const otherId = msg.sender_id === vendorId ? msg.recipient_id : msg.sender_id;
        if (!otherId) return;

        if (
          !chats[otherId] ||
          new Date(msg.created_at) > new Date(chats[otherId].lastMessageDate)
        ) {
          chats[otherId] = {
            userId: otherId,
            lastMessage: msg.message_text,
            lastMessageDate: msg.created_at,
            unreadCount: 0,
          };
        }

        if (!msg.is_read && msg.recipient_id === vendorId) {
          chats[otherId].unreadCount += 1;
        }
      });

      const ids = Object.keys(chats);
      let userNames = {};
      if (ids.length) {
        for (const id of ids) {
          const { data: udata } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", id)
            .maybeSingle();
          userNames[id] = udata?.full_name || "User";
        }
      }

      setUserList(
        Object.values(chats).map((chat) => ({
          ...chat,
          fullName: userNames[chat.userId] || "User",
        }))
      );
    };
    fetchChats();
  }, [isOpen, vendorId]);

  // Fetch messages when a user is selected
  useEffect(() => {
    if (!selectedUserId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${vendorId},recipient_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},recipient_id.eq.${vendorId})`
        )
        .order("created_at", { ascending: true });

      setMessages(data || []);

      const { data: udata } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", selectedUserId)
        .maybeSingle();
      setSelectedUserName(udata?.full_name || "User");

      // mark all unread messages as read immediately when chat is opened
      const unread = data
        ?.filter((msg) => msg.recipient_id === vendorId && !msg.is_read)
        .map((m) => m.id);

      if (unread?.length) {
        await supabase.from("messages").update({ is_read: true }).in("id", unread);
        setUserList((prev) =>
          prev.map((u) =>
            u.userId === selectedUserId ? { ...u, unreadCount: 0 } : u
          )
        );
      }
    };
    fetchMessages();
  }, [selectedUserId, vendorId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;

    // const tempId = `temp-${Date.now()}`;
    // const tempMsg = {
    //   id: tempId,
    //   sender_id: vendorId,
    //   recipient_id: selectedUserId,
    //   message_text: newMessage,
    //   is_read: false,
    //   created_at: new Date().toISOString(),
    // };

    // setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    await supabase.from("messages").insert([
      {
        sender_id: vendorId,
        recipient_id: selectedUserId,
        message_text: newMessage,
        message_type: "text",
        is_read: false,
      },
    ]);
  };

 const handleRealtimeInsert = async (msg) => {
  if (!(msg.sender_id === vendorId || msg.recipient_id === vendorId)) return;

  const otherId =
    msg.sender_id === vendorId ? msg.recipient_id : msg.sender_id;

  // 🧩 prevent duplicate entries (real + optimistic)
  setMessages((prev) => {
    // if a temp message already matches this (based on text + time range), replace it
    const existing = prev.find(
      (m) =>
        m.id === msg.id ||
        (m.sender_id === msg.sender_id &&
          m.recipient_id === msg.recipient_id &&
          m.message_text === msg.message_text &&
          m.created_at &&
          Math.abs(new Date(m.created_at) - new Date(msg.created_at)) < 2000)
    );

    if (existing) {
      // replace temp message with real one
      return prev.map((m) => (m.id === existing.id ? msg : m));
    }
    return [...prev, msg];
  });

  // if currently chatting with this user
  if (selectedUserId && otherId === selectedUserId) {
    // immediately mark as read
    if (msg.recipient_id === vendorId && !msg.is_read) {
      await supabase.from("messages").update({ is_read: true }).eq("id", msg.id);
    }

    // update last message & unread count
    setUserList((prev) =>
      prev.map((u) =>
        u.userId === selectedUserId
          ? { ...u, lastMessage: msg.message_text, unreadCount: 0 }
          : u
      )
    );
  } else {
    // vendor not in chat
    setUserList((prev) => {
      const existing = prev.find((u) => u.userId === otherId);
      if (existing) {
        return prev.map((u) =>
          u.userId === otherId
            ? {
                ...u,
                lastMessage: msg.message_text,
                lastMessageDate: msg.created_at,
                unreadCount:
                  msg.recipient_id === vendorId
                    ? u.unreadCount + 1
                    : u.unreadCount,
              }
            : u
        );
      } else {
        return [
          ...prev,
          {
            userId: otherId,
            fullName: "User",
            lastMessage: msg.message_text,
            lastMessageDate: msg.created_at,
            unreadCount: msg.recipient_id === vendorId ? 1 : 0,
          },
        ];
      }
    });
  }
};


  // Subscribe to realtime
  useEffect(() => {
    if (!vendorId) return;
    const channel = supabase
      .channel("realtime-vendor-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => handleRealtimeInsert(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, selectedUserId]);

  return (
   
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} onClick={onClose}>
          <IoClose style={{ fontSize: "24px" }} />
        </button>

        <div className={styles.vendorChatContainer}>
          {/* Left panel: user list */}
          <div className={styles.userListPanel}>
            <h4>Messages</h4>
            <div className={styles.scrollPanel}>
              {userList.length === 0 && (
                <div className={styles.noChats}>No active chats</div>
              )}
              {userList.map((user) => (
                <div
                  key={user.userId}
                  className={`${styles.userItem} ${
                    selectedUserId === user.userId ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedUserId(user.userId)}
                >
                  <div className={styles.avatarInitial}>
                    {user.fullName[0]?.toUpperCase() || "U"}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userIdTruncate}>
                      {user.fullName}
                    </span>
                    <span className={styles.messageCount}>
                      {user.lastMessage}
                    </span>
                  </div>
                  {user.unreadCount > 0 && (
                    <span
                      className={styles.unreadDot}
                      title={`${user.unreadCount} unread`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: chat window */}
          <div className={styles.chatAreaPanel}>
            {selectedUserId ? (
              <>
                <div className={styles.chatHeader}>
                  <h4>Chat with {selectedUserName}</h4>
                  <span className={styles.selectedUserId}>
                    {selectedUserId}
                  </span>
                </div>

                <div className={styles.messagesContainer}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id || msg.created_at}
                      className={`${styles.messageBubble} ${
                        msg.sender_id === vendorId
                          ? styles.vendorBubble
                          : styles.userBubble
                      }`}
                    >
                      <div className={styles.messageText}>
                        {msg.message_text}
                      </div>
                      <div className={styles.messageTime}>
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString()
                          : ""}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className={styles.messageInput}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your response..."
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className={styles.sendBtn}
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.noChatSelected}>
                Select a user to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    // </div>
  );
};

export default VendorChat;
