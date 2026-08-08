"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = { id: string; sender_type: "customer" | "admin"; sender_name: string; content: string; created_at: string };
type Step = "closed" | "form" | "chat";

export default function ChatWidget() {
  const [step, setStep] = useState<Step>("closed");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [authedName, setAuthedName] = useState("");
  const [authedEmail, setAuthedEmail] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // External trigger — allows other components to open the chat
  useEffect(() => {
    function handleOpenChat() { open(); }
    window.addEventListener("open-chat", handleOpenChat);
    return () => window.removeEventListener("open-chat", handleOpenChat);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId]);

  // Restore session from localStorage + pre-fill from auth
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const currentEmail = data.user?.email ?? null;
      if (data.user) {
        const n = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "";
        const e = data.user.email || "";
        setAuthedName(n);
        setAuthedEmail(e);
        setName(prev => prev || n);
        setEmail(prev => prev || e);
      }

      const saved = localStorage.getItem("snd_conv");
      if (saved) {
        const parsed = JSON.parse(saved) as { id: string; name: string; email?: string };
        // Different logged-in user — clear stale conversation
        if (parsed.email && currentEmail && parsed.email !== currentEmail) {
          localStorage.removeItem("snd_conv");
          return;
        }
        setConvId(parsed.id);
        setName(n => n || parsed.name);
        fetch(`/api/chat/conversations/${parsed.id}/messages`)
          .then(r => r.json())
          .then((msgs: Message[]) => { if (Array.isArray(msgs)) setMessages(msgs); });
      }
    });
  }, []);

  // Real-time subscription + polling fallback
  useEffect(() => {
    if (!convId) return;

    // Poll every 4s as reliable fallback
    const poll = setInterval(() => {
      fetch(`/api/chat/conversations/${convId}/messages`)
        .then(r => r.json())
        .then((data: Message[]) => { if (Array.isArray(data)) setMessages(data); });
    }, 4000);

    const supabase = createClient();
    const channel = supabase
      .channel(`conv-${convId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
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
  }, [convId]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !input.trim()) return;
    setStarting(true);
    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_name: name.trim(), customer_email: email.trim() || undefined, first_message: input.trim() }),
    });
    if (res.ok) {
      const { id } = await res.json() as { id: string };
      setConvId(id);
      localStorage.setItem("snd_conv", JSON.stringify({ id, name: name.trim(), email: email.trim() || null }));
      const msgs = await fetch(`/api/chat/conversations/${id}/messages`).then(r => r.json()) as Message[];
      setMessages(Array.isArray(msgs) ? msgs : []);
      setInput("");
      setStep("chat");
    }
    setStarting(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !convId) return;
    setSending(true);
    const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_type: "customer", sender_name: name, content: input.trim() }),
    });
    if (res.ok) setInput("");
    setSending(false);
  }

  function open() {
    if (convId) { setStep("chat"); } else { setStep("form"); }
  }

  const unread = step !== "chat" && messages.some(m => m.sender_type === "admin");

  return (
    <div className="fixed bottom-6 right-5 z-[60] flex flex-col items-end gap-3 font-body">
      {/* Chat window */}
      {step !== "closed" && (
        <div className="rounded-md overflow-hidden shadow-2xl flex flex-col bg-paper border border-line"
          style={{ width: 340, height: 480 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-ink">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-state-onhand" />
              <span className="text-body-sm font-medium text-paper">Sneak N&apos; Drip Support</span>
            </div>
            <button onClick={() => setStep("closed")} className="text-paper opacity-60 hover:opacity-100">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Form step */}
          {step === "form" && (
            <form onSubmit={handleStart} className="flex flex-col flex-1 p-4 gap-3 overflow-y-auto">
              <div className="p-3 rounded-md text-body-sm leading-relaxed bg-paper-2 text-ink-2">
                Hi! We&apos;re here to help. Send us a message and we&apos;ll reply ASAP!
              </div>
              <div>
                <label className="block text-micro font-medium uppercase tracking-wide mb-1 text-ink-3">
                  Name <span className="text-state-error">*</span>
                </label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your name"
                  readOnly={!!authedName}
                  className={`w-full px-3 py-2.5 text-body-sm focus:outline-none text-ink rounded-md border ${authedName ? "bg-paper-2 border-line-strong" : "bg-paper-2 border-line"}`} />
              </div>
              <div>
                <label className="block text-micro font-medium uppercase tracking-wide mb-1 text-ink-3">
                  Email
                </label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="Email (optional)"
                  readOnly={!!authedEmail}
                  className={`w-full px-3 py-2.5 text-body-sm focus:outline-none text-ink rounded-md border ${authedEmail ? "bg-paper-2 border-line-strong" : "bg-paper-2 border-line"}`} />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-micro font-medium uppercase tracking-wide mb-1 text-ink-3">
                  Message <span className="text-state-error">*</span>
                </label>
                <textarea value={input} onChange={e => setInput(e.target.value)} required rows={3}
                  placeholder="How can we help you?"
                  className="px-3 py-2.5 text-body-sm focus:outline-none resize-none flex-1 bg-paper-2 border border-line rounded-md text-ink" />
              </div>
              <button type="submit" disabled={starting}
                className="flex items-center justify-center gap-2 py-3 rounded-md text-body-sm font-medium uppercase tracking-wide disabled:opacity-50 bg-ink text-paper hover:bg-ink-2 transition-colors">
                <Send className="w-4 h-4" />
                {starting ? "Starting…" : "Start Chat"}
              </button>
            </form>
          )}

          {/* Chat step */}
          {step === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-micro text-center text-ink-3">No messages yet.</p>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_type === "customer" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-md text-body-sm leading-relaxed ${
                      m.sender_type === "customer" ? "bg-ink text-paper" : "bg-paper-2 text-ink border border-line"
                    }`}
                      style={{
                        borderBottomRightRadius: m.sender_type === "customer" ? 4 : undefined,
                        borderBottomLeftRadius: m.sender_type === "admin" ? 4 : undefined,
                      }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 p-3 shrink-0 border-t border-line">
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 text-body-sm focus:outline-none bg-paper-2 border border-line rounded-md text-ink" />
                <button type="submit" disabled={sending || !input.trim()}
                  className="px-3 py-2 rounded-md disabled:opacity-40 transition-opacity hover:opacity-80 bg-ink text-paper">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => step === "closed" ? open() : setStep("closed")}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 relative bg-ink">
        {step === "closed" ? (
          <MessageCircle className="w-6 h-6 text-paper" />
        ) : (
          <X className="w-6 h-6 text-paper" />
        )}
        {unread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-medium text-paper flex items-center justify-center bg-state-error">!</span>
        )}
      </button>
    </div>
  );
}
