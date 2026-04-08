"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Share2, Eye, Edit, Copy, Check, X, Trash2,
  Globe, Link2, Users, Lock, ChevronDown,
  MessageSquare, Search, BookOpen, User,
  ToggleLeft, ToggleRight, Send, Wifi,
  Shield, Pencil, ExternalLink, Plus,
} from "lucide-react";

interface ShareButtonProps {
  resourceId?: string;
  resourceName?: string;
  resourceType?: "project" | "presentation" | "whiteboard" | "video" | "socialmedia";
  projectId?: string;
  projectName?: string;
  collaboratorProjectId?: string;
}

interface ShareLink {
  token: string;
  permission: "view" | "edit";
  createdAt: string;
  expiresAt: string | null;
}

interface Invite {
  email: string;
  role: "viewer" | "commenter" | "editor";
  status: "pending" | "accepted";
  addedAt: string;
}

interface InviteFeedback {
  type: "success" | "warning" | "error";
  message: string;
}

/* ── Tiny helpers ── */
const ROLE_CONFIG = {
  viewer:    { label: "Viewer",    icon: Eye,           color: "text-sky-500",    bg: "bg-sky-500/10"    },
  commenter: { label: "Commenter", icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10" },
  editor:    { label: "Editor",    icon: Pencil,        color: "text-emerald-500",bg: "bg-emerald-500/10"},
};

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none ${
        on ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${on ? "translate-x-5" : "translate-x-0"}`}/>
    </button>
  );
}

function RoleDropdown({
  value, onChange, isDark,
}: {
  value: "viewer" | "commenter" | "editor";
  onChange: (r: "viewer" | "commenter" | "editor") => void;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = ROLE_CONFIG[value];
  const Icon = cfg.icon;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${cfg.bg} ${cfg.color} border ${isDark ? "border-white/10" : "border-black/10"}`}
      >
        <Icon size={12}/>
        {cfg.label}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>

      {open && (
        <div className={`absolute right-0 top-full mt-1.5 z-999 w-44 rounded-xl border shadow-2xl overflow-hidden ${
          isDark ? "bg-[#1e1f26] border-white/10" : "bg-white border-gray-200"
        }`}>
          {(["viewer", "commenter", "editor"] as const).map(role => {
            const c = ROLE_CONFIG[role];
            const RIcon = c.icon;
            return (
              <button
                key={role}
                onClick={() => { onChange(role); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-all ${
                  value === role
                    ? `${c.bg} ${c.color}`
                    : isDark ? "text-gray-400 hover:bg-white/5 hover:text-white" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <RIcon size={13}/>
                <div className="text-left">
                  <div className="font-semibold">{c.label}</div>
                </div>
                {value === role && <Check size={11} className="ml-auto"/>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════ */
export default function ShareButton({
  resourceId,
  resourceName,
  resourceType = "project",
  projectId,
  collaboratorProjectId,
  projectName,
}: ShareButtonProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const targetId = resourceId || projectId || "";
  const targetName = resourceName || projectName || "Untitled";
  const collaboratorTargetId = resourceType === "project"
    ? targetId
    : (collaboratorProjectId || "");
  const canManageCollaborators = Boolean(collaboratorTargetId);
  const shareApiBase = resourceType === "project"
    ? `/api/projects/${targetId}/share`
    : resourceType === "presentation"
      ? `/api/presentations/${targetId}/share`
      : `/api/databases/${targetId}/share`;
  const collaboratorApiBase = `/api/projects/${collaboratorTargetId}/collaborators`;
  const sharedPathBase = resourceType === "project"
    ? "/shared"
    : resourceType === "presentation"
      ? "/presentation/shared"
      : resourceType === "whiteboard"
        ? "/whiteboard/shared"
        : resourceType === "video"
          ? "/video-editing/shared"
          : "/socialmedia/shared";

  const [showModal,    setShowModal]    = useState(false);
  const [activeTab,    setActiveTab]    = useState<"share" | "publish">("share");
  const [shareLinks,   setShareLinks]   = useState<ShareLink[]>([]);
  const [invites,      setInvites]      = useState<Invite[]>([]);
  const [isLoading,    setIsLoading]    = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedToken,  setCopiedToken]  = useState<string | null>(null);
  const [generatedLink,setGeneratedLink]= useState("");

  /* invite form */
  const [inviteEmail,   setInviteEmail]   = useState("");
  const [inviteRole,    setInviteRole]    = useState<"viewer"|"commenter"|"editor">("viewer");
  const [isSendingInv,  setIsSendingInv]  = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<InviteFeedback | null>(null);

  /* permission for new generated link */
  const [linkPermission, setLinkPermission] = useState<"view"|"edit">("view");

  /* access control */
  const [accessMode, setAccessMode] = useState<"invite-only"|"anyone-view"|"anyone-edit">("invite-only");

  /* publish tab state */
  const [isPublished,       setIsPublished]       = useState(false);
  const [allowEditing,      setAllowEditing]       = useState(false);
  const [allowComments,     setAllowComments]      = useState(true);
  const [allowDuplicate,    setAllowDuplicate]     = useState(true);
  const [searchIndexing,    setSearchIndexing]     = useState(false);
  const [showTitle,         setShowTitle]          = useState(true);
  const [showAuthor,        setShowAuthor]         = useState(true);
  const [publishedUrl,      setPublishedUrl]       = useState("");
  const [publishCopied,     setPublishCopied]      = useState(false);

  const activeViewers = invites.filter((i) => i.status === "accepted").map((i) => ({
    name: i.email,
    color: i.role === "editor" ? "bg-emerald-500" : i.role === "commenter" ? "bg-violet-500" : "bg-sky-500",
  }));

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showModal) return;
    loadShareLinks();
    if (canManageCollaborators) {
      loadCollaborators();
    } else {
      setInvites([]);
    }
  }, [showModal, targetId, canManageCollaborators]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setShowModal(false);
    };
    if (showModal) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showModal]);

  const loadShareLinks = async () => {
    if (!targetId) return;
    setIsLoading(true);
    try {
      const res = await fetch(shareApiBase);
      if (res.ok) { const d = await res.json(); setShareLinks(d.shareLinks || []); }
    } catch {}
    setIsLoading(false);
  };

  const loadCollaborators = async () => {
    if (!canManageCollaborators) return;
    try {
      const res = await fetch(collaboratorApiBase);
      if (res.ok) {
        const data = await res.json();
        setInvites(Array.isArray(data.collaborators) ? data.collaborators : []);
      }
    } catch {}
  };

  const generateLink = async () => {
    if (!targetId) return;
    setIsGenerating(true);
    try {
      const res = await fetch(shareApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission: linkPermission }),
      });
      if (res.ok) { const d = await res.json(); setGeneratedLink(d.shareUrl); await loadShareLinks(); }
    } catch {}
    setIsGenerating(false);
  };

  const deleteShareLink = async (token: string) => {
    if (!targetId) return;
    if (!confirm("Delete this share link?")) return;
    try {
      const res = await fetch(shareApiBase, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) { await loadShareLinks(); if (generatedLink.includes(token)) setGeneratedLink(""); }
    } catch {}
  };

  const sendInvite = async () => {
    if (!canManageCollaborators) return;
    if (!inviteEmail.trim()) return;
    setIsSendingInv(true);
    setInviteFeedback(null);

    const targetEmail = inviteEmail.trim().toLowerCase();

    try {
      const res = await fetch(collaboratorApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, role: inviteRole }),
      });

      if (res.ok) {
        const data = await res.json();
        setInvites(Array.isArray(data.collaborators) ? data.collaborators : []);
        setInviteEmail("");
        if (data.emailSent) {
          setInviteFeedback({
            type: "success",
            message: `Invite sent to ${targetEmail} and email delivered.`,
          });
        } else {
          setInviteFeedback({
            type: "warning",
            message: `Invite saved for ${targetEmail}, but email could not be sent.`,
          });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setInviteFeedback({
          type: "error",
          message: data?.error || "Could not send invite.",
        });
      }
    } catch {
      setInviteFeedback({
        type: "error",
        message: "Network error while sending invite.",
      });
    }
    setIsSendingInv(false);
  };

  const removeInvite = async (email: string) => {
    if (!canManageCollaborators) return;
    try {
      const res = await fetch(collaboratorApiBase, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvites(Array.isArray(data.collaborators) ? data.collaborators : []);
      }
    } catch {}
  };

  const copyLink = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(key);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const publishPage = async () => {
    if (!targetId) return;
    try {
      const res = await fetch(shareApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission: allowEditing ? "edit" : "view" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.shareUrl) {
          setPublishedUrl(data.shareUrl);
          setIsPublished(true);
          await loadShareLinks();
        }
      }
    } catch {}
  };

  const unpublishPage = () => { setIsPublished(false); setPublishedUrl(""); };

  const copyPublishedUrl = () => {
    navigator.clipboard.writeText(publishedUrl);
    setPublishCopied(true);
    setTimeout(() => setPublishCopied(false), 2000);
  };

  /* ── shared styles ── */
  const surface   = isDark ? "bg-[#1a1b1f]"   : "bg-white";
  const surface2  = isDark ? "bg-[#25262d]"   : "bg-gray-50";
  const border    = isDark ? "border-white/8"  : "border-gray-200";
  const txt       = isDark ? "text-gray-200"   : "text-gray-800";
  const muted     = isDark ? "text-gray-500"   : "text-gray-400";
  const sectionLbl= `text-[11px] font-bold uppercase tracking-widest ${muted} mb-2`;

  const ACCESS_OPTIONS = [
    { key: "invite-only",  label: "Invite only",      sub: "Only people you invite",          icon: Lock,   color: "text-rose-500"   },
    { key: "anyone-view",  label: "Anyone with link",  sub: "Link holders can view",           icon: Link2,  color: "text-sky-500"    },
    { key: "anyone-edit",  label: "Anyone can edit",   sub: "Link holders can view & edit",    icon: Globe,  color: "text-emerald-500"},
  ] as const;

  const shareTabs: Array<{ key: "share" | "publish"; label: string; icon: typeof Users }> = [
    { key: "share", label: "Share", icon: Users },
    { key: "publish", label: "Publish", icon: Globe as typeof Users },
  ];

  return (
    <>
      {/* ── Trigger ── */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-500/25"
      >
        <Share2 size={15}/>
        Share
      </button>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-999 p-4">
          <div
            ref={modalRef}
            className={`w-full max-w-xl rounded-2xl shadow-2xl border ${surface} ${border} ${txt} flex flex-col overflow-hidden`}
            style={{ maxHeight: "90vh" }}
          >

            {/* ── Modal header ── */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${border} shrink-0`}>
              <div>
                <h2 className="text-base font-bold">{targetName}</h2>
                <p className={`text-xs mt-0.5 ${muted}`}>Manage access and publishing</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Active viewers */}
                {canManageCollaborators && activeViewers.length > 0 && (
                  <div className="flex items-center gap-1.5 mr-2">
                    <Wifi size={12} className="text-emerald-400 animate-pulse"/>
                    <div className="flex -space-x-1.5">
                      {activeViewers.map(v => (
                        <div key={v.name} title={`${v.name} is viewing`}
                          className={`w-6 h-6 rounded-full ${v.color} ring-2 ${isDark?"ring-[#1a1b1f]":"ring-white"} flex items-center justify-center text-[9px] text-white font-bold`}>
                          {v.name[0]}
                        </div>
                      ))}
                    </div>
                    <span className={`text-[11px] ${muted}`}>{activeViewers.length} viewing</span>
                  </div>
                )}

                <button onClick={() => setShowModal(false)}
                  className={`p-1.5 rounded-lg transition ${isDark?"hover:bg-white/8":"hover:bg-gray-100"}`}>
                  <X size={16}/>
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className={`flex gap-1 px-6 pt-3 pb-0 shrink-0`}>
              {shareTabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold transition-all border-b-2 ${
                    activeTab === tab.key
                      ? `border-indigo-500 text-indigo-500 ${isDark?"bg-indigo-500/8":"bg-indigo-50"}`
                      : `border-transparent ${muted} hover:text-current`
                  }`}>
                  <tab.icon size={14}/>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* ════ SHARE TAB ════ */}
              {activeTab === "share" && (
                <div className="px-6 py-5 space-y-5">

                  {/* Invite by email */}
                  {canManageCollaborators && (
                  <div>
                    <p className={sectionLbl}>Invite People</p>
                    <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${border} ${surface2}`}>
                      <input
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendInvite()}
                        placeholder="Add email address…"
                        className={`flex-1 bg-transparent text-sm px-2 py-1 outline-none placeholder:${muted}`}
                      />
                      <RoleDropdown value={inviteRole} onChange={setInviteRole} isDark={isDark}/>
                      <button
                        onClick={sendInvite}
                        disabled={!inviteEmail.trim() || isSendingInv}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-40"
                      >
                        {isSendingInv
                          ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin"/>
                          : <Send size={11}/>
                        }
                        Invite
                      </button>
                    </div>
                    {inviteFeedback && (
                      <p
                        className={`mt-2 text-xs ${
                          inviteFeedback.type === "success"
                            ? "text-emerald-500"
                            : inviteFeedback.type === "warning"
                            ? "text-amber-500"
                            : "text-rose-500"
                        }`}
                      >
                        {inviteFeedback.message}
                      </p>
                    )}
                  </div>
                  )}

                  {/* People list */}
                  {canManageCollaborators && invites.length > 0 && (
                    <div>
                      <p className={sectionLbl}>People with access ({invites.length})</p>
                      <div className="space-y-1.5">
                        {invites.map(inv => {
                          const cfg = ROLE_CONFIG[inv.role];
                          const RIcon = cfg.icon;
                          return (
                            <div key={inv.email}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${border} ${surface2}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                inv.role === "editor" ? "bg-emerald-500" : inv.role === "commenter" ? "bg-violet-500" : "bg-sky-500"
                              }`}>
                                {inv.email[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{inv.email}</p>
                                <p className={`text-[11px] ${muted} capitalize`}>
                                  {inv.status === "pending" ? "⏳ Invite pending" : "✓ Active"}
                                </p>
                              </div>
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                                <RIcon size={11}/>
                                {cfg.label}
                              </div>
                              <button onClick={() => removeInvite(inv.email)}
                                className={`p-1.5 rounded-lg transition ${isDark?"hover:bg-red-500/15 text-gray-600 hover:text-red-400":"hover:bg-red-50 text-gray-400 hover:text-red-500"}`}
                                title="Remove access">
                                <X size={13}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Access control */}
                  {canManageCollaborators && (
                  <div>
                    <p className={sectionLbl}>General access</p>
                    <div className={`rounded-xl border ${border} overflow-hidden`}>
                      {ACCESS_OPTIONS.map((opt, i) => {
                        const Icon = opt.icon;
                        const active = accessMode === opt.key;
                        return (
                          <button key={opt.key} onClick={() => setAccessMode(opt.key)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                              i > 0 ? `border-t ${border}` : ""
                            } ${active ? isDark?"bg-white/5":"bg-gray-50" : isDark?"hover:bg-white/3":"hover:bg-gray-50/50"}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? opt.color.replace("text-","bg-").replace("500","500/15") : isDark?"bg-white/5":"bg-gray-100"}`}>
                              <Icon size={15} className={active ? opt.color : muted}/>
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${active ? "" : muted}`}>{opt.label}</p>
                              <p className={`text-[11px] ${muted}`}>{opt.sub}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              active ? "border-indigo-500" : isDark?"border-gray-600":"border-gray-300"
                            }`}>
                              {active && <div className="w-2 h-2 rounded-full bg-indigo-500"/>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  )}

                  {/* Generate link */}
                  <div>
                    <p className={sectionLbl}>Share link</p>
                    <div className={`rounded-xl border ${border} ${surface2} p-4 space-y-3`}>
                      <div className="flex gap-2">
                        {(["view","edit"] as const).map(perm => (
                          <button key={perm} onClick={() => setLinkPermission(perm)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border ${
                              linkPermission === perm
                                ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                                : `${border} ${muted}`
                            }`}>
                            {perm === "view" ? "👁 View only" : "✏️ Can edit"}
                          </button>
                        ))}
                      </div>

                      {generatedLink ? (
                        <div className={`flex items-center gap-2 p-2 rounded-lg border ${border} ${isDark?"bg-black/20":"bg-white"}`}>
                          <Link2 size={13} className="text-indigo-400 shrink-0"/>
                          <span className={`flex-1 text-xs truncate ${muted}`}>{generatedLink}</span>
                          <button onClick={() => copyLink(generatedLink, "gen")}
                            className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                              copiedToken === "gen"
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}>
                            {copiedToken === "gen" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      ) : (
                        <button onClick={generateLink} disabled={isGenerating}
                          className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                          {isGenerating
                            ? <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin"/> Generating…</>
                            : <><Plus size={13}/> Generate Link</>
                          }
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Existing links */}
                  {shareLinks.length > 0 && (
                    <div>
                      <p className={sectionLbl}>Active links ({shareLinks.length})</p>
                      <div className="space-y-1.5">
                        {shareLinks.map(link => {
                          const fullUrl = `${window.location.origin}${sharedPathBase}/${link.token}`;
                          const isView = link.permission === "view";
                          return (
                            <div key={link.token}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${border} ${surface2}`}>
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                isView ? "bg-sky-500/15" : "bg-emerald-500/15"
                              }`}>
                                {isView ? <Eye size={13} className="text-sky-500"/> : <Edit size={13} className="text-emerald-500"/>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold capitalize">{link.permission} access</p>
                                <p className={`text-[11px] ${muted}`}>Created {new Date(link.createdAt).toLocaleDateString()}</p>
                              </div>
                              <button onClick={() => copyLink(fullUrl, link.token)}
                                className={`p-1.5 rounded-lg transition ${isDark?"hover:bg-white/8":"hover:bg-gray-100"}`}>
                                {copiedToken === link.token
                                  ? <Check size={13} className="text-emerald-500"/>
                                  : <Copy size={13}/>
                                }
                              </button>
                              <button onClick={() => deleteShareLink(link.token)}
                                className={`p-1.5 rounded-lg transition ${isDark?"hover:bg-red-500/15 text-gray-600 hover:text-red-400":"hover:bg-red-50 text-gray-400 hover:text-red-500"}`}>
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════ PUBLISH TAB ════ */}
              {activeTab === "publish" && (
                <div className="px-6 py-5 space-y-5">

                  {/* Publish hero card */}
                  <div className={`rounded-2xl border ${border} overflow-hidden`}>
                    <div className={`px-5 py-4 flex items-center justify-between ${
                      isPublished
                        ? isDark?"bg-emerald-900/20":"bg-emerald-50"
                        : isDark?"bg-white/3":"bg-gray-50"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isPublished ? "bg-emerald-500" : isDark?"bg-white/8":"bg-gray-200"
                        }`}>
                          <Globe size={18} className={isPublished ? "text-white" : muted}/>
                        </div>
                        <div>
                          <p className="text-sm font-bold">
                            {isPublished ? "Live on the web" : "Publish to web"}
                          </p>
                          <p className={`text-xs ${muted}`}>
                            {isPublished ? "Anyone with the link can access" : "Make this page publicly accessible"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={isPublished ? unpublishPage : publishPage}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                          isPublished
                            ? isDark?"bg-white/8 text-gray-300 hover:bg-white/12":"bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                        }`}>
                        {isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </div>

                    {/* Published URL */}
                    {isPublished && publishedUrl && (
                      <div className={`px-5 py-3 border-t ${border} flex items-center gap-2`}>
                        <ExternalLink size={13} className="text-emerald-500 shrink-0"/>
                        <span className={`flex-1 text-xs truncate ${muted}`}>{publishedUrl}</span>
                        <button onClick={copyPublishedUrl}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                            publishCopied
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : isDark?"bg-white/8 text-gray-300 hover:bg-white/12":"bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}>
                          {publishCopied ? <><Check size={11}/>Copied</> : <><Copy size={11}/>Copy link</>}
                        </button>
                        <a href={publishedUrl} target="_blank" rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg transition ${isDark?"hover:bg-white/8":"hover:bg-gray-100"}`}>
                          <ExternalLink size={13}/>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Page settings */}
                  <div>
                    <p className={sectionLbl}>Public settings</p>
                    <div className={`rounded-xl border ${border} divide-y ${isDark?"divide-white/8":"divide-gray-100"}`}>
                      {[
                        { key: "allowEditing",   label: "Allow editing",   sub: "Visitors can edit this page",         icon: Pencil,        val: allowEditing,   set: setAllowEditing   },
                        { key: "allowComments",  label: "Allow comments",  sub: "Visitors can leave comments",         icon: MessageSquare, val: allowComments,  set: setAllowComments  },
                        { key: "allowDuplicate", label: "Allow duplicate", sub: "Visitors can duplicate to workspace", icon: Copy,          val: allowDuplicate, set: setAllowDuplicate },
                        { key: "searchIndexing", label: "Search indexing", sub: "Allow Google to index this page",     icon: Search,        val: searchIndexing, set: setSearchIndexing },
                      ].map(item => {
                        const Icon = item.icon;
                        return (
                          <div key={item.key} className={`flex items-center gap-3 px-4 py-3 ${surface2}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark?"bg-white/5":"bg-gray-100"}`}>
                              <Icon size={13} className={muted}/>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className={`text-[11px] ${muted}`}>{item.sub}</p>
                            </div>
                            <Toggle on={item.val} onChange={() => item.set(!item.val)}/>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Appearance */}
                  <div>
                    <p className={sectionLbl}>Appearance</p>
                    <div className={`rounded-xl border ${border} divide-y ${isDark?"divide-white/8":"divide-gray-100"}`}>
                      {[
                        { key: "showTitle",  label: "Show page title",  sub: "Display the title at the top", icon: BookOpen, val: showTitle,  set: setShowTitle  },
                        { key: "showAuthor", label: "Show author",       sub: "Display who created the page", icon: User,     val: showAuthor, set: setShowAuthor },
                      ].map(item => {
                        const Icon = item.icon;
                        return (
                          <div key={item.key} className={`flex items-center gap-3 px-4 py-3 ${surface2}`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark?"bg-white/5":"bg-gray-100"}`}>
                              <Icon size={13} className={muted}/>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className={`text-[11px] ${muted}`}>{item.sub}</p>
                            </div>
                            <Toggle on={item.val} onChange={() => item.set(!item.val)}/>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Info note */}
                  <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border ${border} ${isDark?"bg-amber-500/5 border-amber-500/20":"bg-amber-50 border-amber-200"}`}>
                    <Shield size={14} className="text-amber-500 mt-0.5 shrink-0"/>
                    <p className={`text-xs leading-relaxed ${isDark?"text-amber-300":"text-amber-700"}`}>
                      Published pages are visible to anyone on the internet. Review your content before publishing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className={`px-6 py-3 border-t ${border} flex items-center justify-between shrink-0`}>
              <div className={`flex items-center gap-1.5 text-[11px] ${muted}`}>
                <Shield size={11}/>
                Secured by OorkSpace
              </div>
              <button onClick={() => setShowModal(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isDark?"bg-white/5 hover:bg-white/10 text-gray-300":"bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}