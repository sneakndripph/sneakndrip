"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, ChevronLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = { id: string; sender_type: "customer" | "admin"; sender_name: string; content: string; created_at: string };
type Conversation = { id: string; customer_name: string; customer_email: string | null; status: string; last_message: string | null; unread_admin: number; updated_at: string };

export default function AdminChatClient({ initialConvs }: { initialConvs: Conversation[] }) {
  const [convs, setConvs] = useState(initialConvs);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/chat/conversations/${activeId}/messages`)
      .then(r => r.json())
      .then((data: Message[]) => { if (Array.isArray(data)) setMessages(data); });
    queueMicrotask(() => setConvs(prev => prev.map(c => c.id === activeId ? { ...c, unread_admin: 0 } : c)));
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;

    const poll = setInterval(() => {
      fetch(`/api/chat/conversations/${activeId}/messages`)
        .then(r => r.json())
        .then((data: Message[]) => { if (Array.isArray(data)) setMessages(data); });
    }, 4000);

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

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [activeId]);

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
          setConvs(prev => {
            const next = prev.some(p => p.id === c.id) ? prev.map(p => p.id === c.id ? c : p) : [c, ...prev];
            return [...next].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !activeId || sending) return;
    setSending(true);
    await fetch(`/api/chat/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_type: "admin", sender_name: "Sneak N' Drip", content: input.trim() }),
    });
    setInput("");
    setSending(false);
    textareaRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const activeConv = convs.find(c => c.id === activeId);
  const totalUnread = convs.reduce((n, c) => n + (c.unread_admin > 0 ? 1 : 0), 0);

  return (
    <div>
      <div className="mb-6">
        <p className="text-admin-eyebrow text-ink-3 mb-1">Support</p>
        <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em] flex items-center gap-3">
          Chat inbox
          {totalUnread > 0 && (
            <span className="text-admin-sm font-medium px-2.5 py-1 rounded-full bg-state-error/10 text-state-error align-middle">
              {totalUnread} new
            </span>
          )}
        </h1>
      </div>

      {convs.length === 0 ? (
        <div className="bg-paper border border-line rounded-md py-20 text-center">
          <MessageCircle className="w-9 h-9 mx-auto mb-3 text-ink-3" />
          <p className="text-admin-title text-ink">No messages yet</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[3fr_7fr] gap-4 h-[calc(100vh-220px)] min-h-[420px]">
          {/* Conversation list */}
          <div className={`${activeId ? "hidden lg:flex" : "flex"} flex-col bg-paper border border-line rounded-md overflow-hidden`}>
            <div className="px-4 py-3 text-admin-eyebrow text-ink-3 border-b border-line shrink-0">
              Conversations ({convs.length})
            </div>
            <div className="flex-1 overflow-y-auto">
              {convs.map(c => (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-line transition-colors duration-admin-fast ${
                    activeId === c.id ? "bg-admin-row-hover border-l-2 border-l-ink" : "hover:bg-admin-row-hover border-l-2 border-l-transparent"
                  }`}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-admin-sm font-semibold text-ink truncate">{c.customer_name}</p>
                    {c.unread_admin > 0 && <span className="w-2 h-2 rounded-full bg-state-error shrink-0" />}
                  </div>
                  {c.customer_email && <p className="text-admin-micro text-ink-3 truncate">{c.customer_email}</p>}
                  {c.last_message && <p className="text-admin-micro text-ink-2 truncate mt-0.5">{c.last_message}</p>}
                  <p className="text-admin-micro text-ink-3 mt-1">
                    {new Date(c.updated_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Message thread */}
          <div className={`${activeId ? "flex" : "hidden lg:flex"} flex-col bg-paper border border-line rounded-md overflow-hidden`}>
            {activeConv ? (
              <>
                <div className="px-4 py-3 shrink-0 flex items-center gap-3 border-b border-line">
                  <button onClick={() => setActiveId(null)} className="lg:hidden p-1 -ml-1 text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                    <ChevronLeft className="w-4.5 h-4.5" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-admin-sm font-semibold text-ink truncate">{activeConv.customer_name}</p>
                    {activeConv.customer_email && <p className="text-admin-micro text-ink-3 truncate">{activeConv.customer_email}</p>}
                  </div>
                  <span className="ml-auto text-admin-micro font-medium px-2 py-0.5 rounded-full bg-paper-2 text-ink-2 shrink-0">
                    {activeConv.status}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[75%]">
                        <p className={`text-admin-micro text-ink-3 mb-1 px-1 ${m.sender_type === "admin" ? "text-right" : ""}`}>
                          {m.sender_name} · {new Date(m.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className={`px-3.5 py-2.5 text-admin-sm leading-relaxed rounded-md ${
                          m.sender_type === "admin" ? "bg-ink text-paper" : "bg-paper-2 text-ink border border-line"
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 shrink-0 border-t border-line">
                  <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Reply to customer…" rows={1}
                    className="flex-1 px-3.5 py-2.5 text-admin-sm bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast resize-none max-h-32" />
                  <button type="submit" disabled={sending || !input.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 text-admin-sm font-medium rounded-md bg-ink text-paper disabled:opacity-40 hover:opacity-90 transition-opacity duration-admin-fast shrink-0">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-admin-sm text-ink-3">Select a conversation</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
