"use client";

import { useState, useEffect, useRef } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Send, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = { id: string; sender_type: "customer" | "admin"; sender_name: string; content: string; created_at: string };
type Conversation = { id: string; customer_name: string; customer_email: string | null; status: string; last_message: string | null; unread_admin: number; updated_at: string };

export default function AdminChatClient({ initialConvs }: { initialConvs: Conversation[] }) {
  const [convs, setConvs] = useState(initialConvs);
  const [activeId, setActiveId] = useState<string | null>(initialConvs[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/chat/conversations/${activeId}/messages`)
      .then(r => r.json())
      .then((data: Message[]) => { if (Array.isArray(data)) setMessages(data); });
    // Mark as read
    setConvs(prev => prev.map(c => c.id === activeId ? { ...c, unread_admin: 0 } : c));
  }, [activeId]);

  // Real-time: new messages in active conv
  useEffect(() => {
    if (!activeId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-conv-${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  // Real-time: new conversations
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-convs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          const c = payload.new as Conversation;
          setConvs(prev => [c, ...prev]);
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const c = payload.new as Conversation;
          setConvs(prev => prev.map(p => p.id === c.id ? c : p));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeId) return;
    setSending(true);
    await fetch(`/api/chat/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_type: "admin", sender_name: "Sneak N' Drip", content: input.trim() }),
    });
    setInput("");
    setSending(false);
  }

  const activeConv = convs.find(c => c.id === activeId);
  const totalUnread = convs.reduce((n, c) => n + (c.unread_admin > 0 ? 1 : 0), 0);

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Support</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
          CHAT INBOX
          {totalUnread > 0 && (
            <span className="ml-3 text-sm font-black px-3 py-1 align-middle"
              style={{ background: BRAND.red, color: "#fff" }}>{totalUnread} new</span>
          )}
        </h1>
      </div>

      {convs.length === 0 ? (
        <div className="py-20 text-center rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: BRAND.black }} />
          <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted, letterSpacing: "0.04em" }}>NO MESSAGES YET</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5 h-[600px]">
          {/* Conversation list */}
          <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="px-4 py-3 text-xs font-black uppercase tracking-widest shrink-0"
              style={{ borderBottom: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
              Conversations ({convs.length})
            </div>
            <div className="flex-1 overflow-y-auto">
              {convs.map(c => (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  className="w-full text-left px-4 py-3.5 transition-colors"
                  style={{
                    borderBottom: `1px solid ${BRAND.border}`,
                    background: activeId === c.id ? `${BRAND.teal}10` : "transparent",
                    borderLeft: `3px solid ${activeId === c.id ? BRAND.teal : "transparent"}`,
                  }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-sm truncate" style={{ color: BRAND.black }}>{c.customer_name}</p>
                    {c.unread_admin > 0 && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: BRAND.red }} />
                    )}
                  </div>
                  {c.customer_email && (
                    <p className="text-xs truncate" style={{ color: BRAND.muted }}>{c.customer_email}</p>
                  )}
                  {c.last_message && (
                    <p className="text-xs truncate mt-0.5" style={{ color: BRAND.mutedLight }}>{c.last_message}</p>
                  )}
                  <p className="text-[10px] mt-1" style={{ color: BRAND.mutedLight }}>
                    {new Date(c.updated_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Message thread */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden flex flex-col"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            {activeConv ? (
              <>
                <div className="px-5 py-3.5 shrink-0 flex items-center gap-3"
                  style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  <div>
                    <p className="font-bold text-sm" style={{ color: BRAND.black }}>{activeConv.customer_name}</p>
                    {activeConv.customer_email && (
                      <p className="text-xs" style={{ color: BRAND.muted }}>{activeConv.customer_email}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5"
                    style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>
                    {activeConv.status}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[75%]">
                        <p className="text-[10px] mb-1 px-1" style={{ color: BRAND.mutedLight }}>
                          {m.sender_name} · {new Date(m.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="px-3.5 py-2.5 text-sm leading-relaxed"
                          style={{
                            background: m.sender_type === "admin" ? BRAND.teal : BRAND.bg,
                            color: m.sender_type === "admin" ? "#fff" : BRAND.black,
                            border: m.sender_type === "customer" ? `1px solid ${BRAND.border}` : "none",
                            borderRadius: m.sender_type === "admin" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                          }}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="flex gap-2 p-3 shrink-0"
                  style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <input value={input} onChange={e => setInput(e.target.value)}
                    placeholder="Reply to customer…"
                    className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
                    style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                  <button type="submit" disabled={sending || !input.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 font-bold text-sm disabled:opacity-40 transition-opacity hover:opacity-80"
                    style={{ background: BRAND.teal, color: "#fff" }}>
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm" style={{ color: BRAND.muted }}>Select a conversation</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
