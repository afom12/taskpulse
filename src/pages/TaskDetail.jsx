import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc, arrayUnion, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  ArrowLeft, CalendarClock, CheckCircle2, ExternalLink, MessageSquare, Pencil, Play, RotateCcw, Send, Trash2, User, Flag, Activity,
} from "lucide-react";
import { db } from "../lib/firebase";
import { notify } from "../lib/notify";
import { HISTORY_LABELS } from "../lib/constants";
import { cn, fmtDateTime, fromNow, isOverdue, toDate } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Avatar, Button, Card, EmptyState, Input, Label, Modal, PriorityBadge, Spinner, StatusBadge, Textarea } from "../components/ui";
import Countdown from "../components/Countdown";
import TaskForm from "../components/TaskForm";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { usersById, admins } = useData();
  const [task, setTask] = useState(undefined); // undefined = loading, null = not found
  const [comments, setComments] = useState([]);
  const [editing, setEditing] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(null); // "approve" | "changes"
  const [busy, setBusy] = useState(false);

  useEffect(() => onSnapshot(doc(db, "tasks", id),
    (s) => setTask(s.exists() ? { id: s.id, ...s.data() } : null),
    () => setTask(null)), [id]);

  useEffect(() => onSnapshot(query(collection(db, "tasks", id, "comments"), orderBy("createdAt", "asc")),
    (s) => setComments(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}), [id]);

  if (task === undefined) return <Spinner />;
  if (task === null)
    return <Card><EmptyState title="Task not found" text="It may have been deleted, or you don't have access to it." action={<Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>} /></Card>;

  const isAssignee = task.assigneeId === profile.id;
  const overdue = isOverdue(task);
  const assignee = usersById[task.assigneeId] ?? { id: task.assigneeId, name: task.assigneeName };
  const entry = (action, note) => ({ action, note: note || null, by: profile.id, byName: profile.name, at: Timestamp.now() });
  const ref = doc(db, "tasks", task.id);
  const adminIds = admins.map((a) => a.id);

  const run = async (fn, ok) => {
    setBusy(true);
    try { await fn(); ok && toast.success(ok); }
    catch (e) { console.error(e); toast.error("That didn't work — please try again"); }
    finally { setBusy(false); }
  };

  const start = () => run(() => updateDoc(ref, { status: "in_progress", history: arrayUnion(entry("started")), updatedAt: serverTimestamp() }), "Marked as in progress");

  const remove = () => {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    run(async () => { await deleteDoc(ref); navigate("/tasks"); }, "Task deleted");
  };

  const canStart = isAssignee && ["todo", "changes_requested"].includes(task.status);
  const canSubmit = isAssignee && ["todo", "in_progress", "changes_requested"].includes(task.status);
  const canReview = isAdmin && task.status === "submitted";

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ---------- main column ---------- */}
        <div className="space-y-6">
          <Card className={cn("p-6", overdue && "ring-rose-200")}>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} overdue={overdue} />
              <PriorityBadge priority={task.priority} />
              <Countdown task={task} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{task.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-slate-600">{task.description || <span className="italic text-slate-400">No description</span>}</p>

            {(canStart || canSubmit || canReview || isAdmin) && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                {canStart && <Button variant="secondary" onClick={start} loading={busy}><Play className="size-4" />Start working</Button>}
                {canSubmit && <Button onClick={() => setSubmitOpen(true)}><Send className="size-4" />{task.status === "changes_requested" ? "Resubmit work" : "Submit work"}</Button>}
                {canReview && <Button variant="success" onClick={() => setReviewMode("approve")}><CheckCircle2 className="size-4" />Approve</Button>}
                {canReview && <Button variant="secondary" onClick={() => setReviewMode("changes")}><RotateCcw className="size-4" />Request changes</Button>}
                {isAdmin && <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil className="size-4" />Edit</Button>
                  <Button variant="ghost" size="sm" onClick={remove} className="text-rose-600 hover:bg-rose-50"><Trash2 className="size-4" />Delete</Button>
                </div>}
              </div>
            )}
          </Card>

          {task.status === "changes_requested" && task.reviewNote && (
            <Card className="border-l-4 border-rose-400 p-5">
              <p className="text-sm font-semibold text-rose-700">Changes requested</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{task.reviewNote}</p>
            </Card>
          )}

          {task.submission && <SubmissionCard task={task} />}

          <Comments task={task} comments={comments} usersById={usersById} adminIds={adminIds} />
        </div>

        {/* ---------- side column ---------- */}
        <div className="space-y-6">
          <Card className="divide-y divide-slate-100">
            <Meta icon={User} label="Assignee"><span className="flex items-center gap-2"><Avatar user={assignee} size="sm" />{assignee.name}</span></Meta>
            <Meta icon={CalendarClock} label="Deadline"><span className={overdue ? "font-semibold text-rose-600" : ""}>{fmtDateTime(task.deadline)}</span></Meta>
            <Meta icon={Flag} label="Created by">{task.createdByName} · {fromNow(task.createdAt)}</Meta>
          </Card>
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Activity className="size-4 text-violet-500" />Activity</h3>
            <ol className="relative mt-4 space-y-4 border-l border-slate-200 pl-5">
              {[...(task.history ?? [])].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-[26px] top-1 size-3 rounded-full ring-4 ring-white",
                    h.action === "approved" ? "bg-emerald-500" : h.action === "changes_requested" ? "bg-rose-500" : h.action === "submitted" ? "bg-amber-500" : "bg-violet-400")} />
                  <p className="text-sm text-slate-700"><b>{h.byName}</b> {HISTORY_LABELS[h.action] ?? h.action}</p>
                  {h.note && <p className="mt-0.5 text-xs italic text-slate-500">“{h.note}”</p>}
                  <p className="text-xs text-slate-400">{fmtDateTime(h.at)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      {editing && <TaskForm open task={task} onClose={() => setEditing(false)} />}
      <SubmitModal open={submitOpen} onClose={() => setSubmitOpen(false)} task={task} entry={entry} adminIds={adminIds} profile={profile} />
      <ReviewModal mode={reviewMode} onClose={() => setReviewMode(null)} task={task} entry={entry} profile={profile} />
    </>
  );
}

const Meta = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3 p-4">
    <Icon className="mt-0.5 size-4 text-slate-400" />
    <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><div className="mt-1 text-sm text-slate-700">{children}</div></div>
  </div>
);

function SubmissionCard({ task }) {
  const s = task.submission;
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Send className="size-4 text-amber-500" />Submission</h3>
        <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", s.isLate ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
          {s.isLate ? "Late" : "On time"} · {fmtDateTime(s.submittedAt)}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{s.note}</p>
      {s.link && (
        <a href={s.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">
          <ExternalLink className="size-4" />Open attached work
        </a>
      )}
    </Card>
  );
}

function SubmitModal({ open, onClose, task, entry, adminIds, profile }) {
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const late = toDate(task.deadline) < new Date();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: "submitted",
        submission: { note: note.trim(), link: link.trim() || null, submittedAt: Timestamp.now(), isLate: late },
        history: arrayUnion(entry("submitted")),
        updatedAt: serverTimestamp(),
      });
      await notify({ userIds: adminIds, type: "submitted", title: late ? "Late submission" : "Work submitted",
        message: `${profile.name} submitted "${task.title}"${late ? " after the deadline" : ""}`, taskId: task.id });
      toast.success(late ? "Submitted (marked late)" : "Submitted on time — nice work! 🎉");
      onClose(); setNote(""); setLink("");
    } catch (err) { console.error(err); toast.error("Could not submit"); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Submit your work">
      <form onSubmit={submit} className="space-y-4">
        {late && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">The deadline has passed. You can still submit, but it will be marked <b>late</b>.</p>}
        <div><Label htmlFor="note">What did you do?</Label><Textarea id="note" required value={note} onChange={(e) => setNote(e.target.value)} placeholder="Summary of the work, how to verify it, anything the reviewer should know…" /></div>
        <div><Label htmlFor="link">Link to the work (optional)</Label><Input id="link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="GitHub PR, Google Drive file, screenshot…" /></div>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}><Send className="size-4" />Submit</Button></div>
      </form>
    </Modal>
  );
}

function ReviewModal({ mode, onClose, task, entry, profile }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const approve = mode === "approve";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: approve ? "approved" : "changes_requested",
        reviewNote: note.trim() || null,
        ...(approve && { approvedAt: serverTimestamp() }),
        history: arrayUnion(entry(approve ? "approved" : "changes_requested", note.trim())),
        updatedAt: serverTimestamp(),
      });
      await notify({ userIds: [task.assigneeId], type: approve ? "approved" : "changes_requested",
        title: approve ? "Work approved ✅" : "Changes requested",
        message: approve ? `${profile.name} approved "${task.title}"` : `${profile.name} asked for changes on "${task.title}"`, taskId: task.id });
      toast.success(approve ? "Approved" : "Sent back for changes");
      onClose(); setNote("");
    } catch (err) { console.error(err); toast.error("Could not save review"); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={Boolean(mode)} onClose={onClose} title={approve ? "Approve this work" : "Request changes"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="rnote">{approve ? "Feedback (optional)" : "What needs to change?"}</Label>
          <Textarea id="rnote" required={!approve} value={note} onChange={(e) => setNote(e.target.value)} placeholder={approve ? "Great work!" : "Be specific so they can fix it quickly…"} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={approve ? "success" : "danger"} loading={busy}>{approve ? "Approve" : "Send back"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Comments({ task, comments, usersById, adminIds }) {
  const { profile } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await addDoc(collection(db, "tasks", task.id, "comments"), { authorId: profile.id, authorName: profile.name, text: text.trim(), createdAt: serverTimestamp() });
      // assignee comments → notify admins; admin comments → notify assignee
      const to = profile.id === task.assigneeId ? adminIds : [task.assigneeId];
      await notify({ userIds: to, type: "comment", title: `New comment from ${profile.name}`, message: `On "${task.title}": ${text.trim().slice(0, 80)}`, taskId: task.id });
      setText("");
    } catch (err) { console.error(err); toast.error("Could not post comment"); }
    finally { setBusy(false); }
  };

  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900"><MessageSquare className="size-4 text-blue-500" />Discussion <span className="text-sm font-normal text-slate-400">{comments.length}</span></h3>
      <div className="mt-4 space-y-4">
        {comments.length === 0 && <p className="text-sm text-slate-400">No comments yet. Ask a question or share an update.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar user={usersById[c.authorId] ?? { id: c.authorId, name: c.authorName }} size="sm" />
            <div className={cn("flex-1 rounded-2xl px-4 py-2.5", c.authorId === profile.id ? "bg-violet-50" : "bg-slate-50")}>
              <p className="text-xs"><b className="text-slate-800">{c.authorName}</b> <span className="text-slate-400">· {fromNow(c.createdAt)}</span></p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-5 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" />
        <Button type="submit" loading={busy} aria-label="Send comment"><Send className="size-4" /></Button>
      </form>
    </Card>
  );
}
