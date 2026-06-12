"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { BRAND, FONTS } from "@/lib/constants";
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
    const saved = localStorage.getItem("snd_conv");
    if (saved) {
      const { id, name: n } = JSON.parse(saved) as { id: string; name: string };
      setConvId(id);
      setName(n);
      fetch(`/api/chat/conversations/${id}/messages`)
        .then(r => r.json())
        .then((data: Message[]) => { if (Array.isArray(data)) setMessages(data); });
    }
    // Pre-fill from Supabase session
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const n = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "";
        const e = data.user.email || "";
        setAuthedName(n);
        setAuthedEmail(e);
        setName(prev => prev || n);
        setEmail(prev => prev || e);
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
      localStorage.setItem("snd_conv", JSON.stringify({ id, name: name.trim() }));
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
    <div className="fixed bottom-6 right-5 z-[60] flex flex-col items-end gap-3" style={{ fontFamily: FONTS.body }}>
      {/* Chat window */}
      {step !== "closed" && (
        <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ width: 340, height: 480, background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: BRAND.black }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="font-bold text-sm text-white">Sneak N&apos; Drip Support</span>
            </div>
            <button onClick={() => setStep("closed")} className="text-white opacity-60 hover:opacity-100">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Form step */}
          {step === "form" && (
            <form onSubmit={handleStart} className="flex flex-col flex-1 p-4 gap-3 overflow-y-auto">
              <div className="p-3 rounded-xl text-sm leading-relaxed"
                style={{ background: `${BRAND.teal}12`, color: BRAND.black }}>
                Hi! 👋 We&apos;re here to help. Send us a message and we&apos;ll reply ASAP!
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.muted }}>
                  Name <span style={{ color: BRAND.red }}>*</span>
                </label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your name"
                  readOnly={!!authedName}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    background: authedName ? `${BRAND.teal}08` : BRAND.bg,
                    border: `1px solid ${authedName ? BRAND.teal + "40" : BRAND.border}`,
                    color: BRAND.black,
                  }} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.muted }}>
                  Email
                </label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="Email (optional)"
                  readOnly={!!authedEmail}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    background: authedEmail ? `${BRAND.teal}08` : BRAND.bg,
                    border: `1px solid ${authedEmail ? BRAND.teal + "40" : BRAND.border}`,
                    color: BRAND.black,
                  }} />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.muted }}>
                  Message <span style={{ color: BRAND.red }}>*</span>
                </label>
                <textarea value={input} onChange={e => setInput(e.target.value)} required rows={3}
                  placeholder="How can we help you?"
                  className="px-3 py-2.5 text-sm focus:outline-none resize-none flex-1"
                  style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
              </div>
              <button type="submit" disabled={starting}
                className="flex items-center justify-center gap-2 py-3 font-bold text-sm uppercase tracking-wide disabled:opacity-50"
                style={{ background: BRAND.teal, color: "#fff" }}>
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
                  <p className="text-xs text-center" style={{ color: BRAND.mutedLight }}>No messages yet.</p>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_type === "customer" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: m.sender_type === "customer" ? BRAND.teal : BRAND.bg,
                        color: m.sender_type === "customer" ? "#fff" : BRAND.black,
                        borderBottomRightRadius: m.sender_type === "customer" ? 4 : undefined,
                        borderBottomLeftRadius: m.sender_type === "admin" ? 4 : undefined,
                        border: m.sender_type === "admin" ? `1px solid ${BRAND.border}` : "none",
                      }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 p-3 shrink-0"
                style={{ borderTop: `1px solid ${BRAND.border}` }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                <button type="submit" disabled={sending || !input.trim()}
                  className="px-3 py-2 disabled:opacity-40 transition-opacity hover:opacity-80"
                  style={{ background: BRAND.teal, color: "#fff" }}>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => step === "closed" ? open() : setStep("closed")}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 relative"
        style={{ background: BRAND.teal }}>
        {step === "closed" ? (
          <MessageCircle className="w-6 h-6 text-white" />
        ) : (
          <X className="w-6 h-6 text-white" />
        )}
        {unread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center"
            style={{ background: BRAND.red }}>!</span>
        )}
      </button>
    </div>
  );
}
