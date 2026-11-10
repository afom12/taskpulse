import { useMemo, useState } from "react";
import { addDoc, arrayUnion, collection, doc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { db } from "../lib/firebase";
import { notify } from "../lib/notify";
import { PRIORITIES, OPEN_STATUSES } from "../lib/constants";
import { toInputDateTime } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Button, Input, Label, Modal, Select, Textarea } from "./ui";

/** Create or edit a task (admin only). */
export default function TaskForm({ open, onClose, task, onSaved }) {
  const { profile } = useAuth();
  const { users, tasks } = useData();
  const editing = Boolean(task);
  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    description: task?.description ?? "",
    assigneeId: task?.assigneeId ?? "",
    priority: task?.priority ?? "medium",
    deadline: toInputDateTime(task?.deadline),
  }));
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Workload hint: helps the admin balance assignments.
  const openCount = useMemo(
    () => tasks.filter((t) => t.assigneeId === form.assigneeId && OPEN_STATUSES.includes(t.status) && t.id !== task?.id).length,
    [tasks, form.assigneeId, task?.id]
  );

  const submit = async (e) => {
    e.preventDefault();
    const deadline = new Date(form.deadline);
    if (!editing && deadline < new Date()) return toast.error("Deadline must be in the future");
    const assignee = users.find((u) => u.id === form.assigneeId);
    if (!assignee) return toast.error("Choose who this task is for");

    setSaving(true);
    try {
      const entry = (action) => ({ action, by: profile.id, byName: profile.name, at: Timestamp.now() });
      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        priority: form.priority,
        deadline: Timestamp.fromDate(deadline),
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        const reassigned = task.assigneeId !== assignee.id;
        const deadlineChanged = task.deadline?.toMillis() !== data.deadline.toMillis();
        await updateDoc(doc(db, "tasks", task.id), {
          ...data,
          // new deadline → reminders should fire again
          ...(deadlineChanged && { reminded24h: false, overdueNotified: false }),
          history: arrayUnion(entry(reassigned ? "reassigned" : "edited")),
        });
        if (reassigned)
          await notify({ userIds: [assignee.id], type: "assigned", title: "New task assigned", message: `${profile.name} assigned you "${data.title}"`, taskId: task.id });
        else if (deadlineChanged)
          await notify({ userIds: [assignee.id], type: "updated", title: "Deadline changed", message: `"${data.title}" has a new deadline`, taskId: task.id });
        toast.success("Task updated");
        onSaved?.(task.id);
      } else {
        const ref = await addDoc(collection(db, "tasks"), {
          ...data, status: "todo", createdBy: profile.id, createdByName: profile.name,
          createdAt: serverTimestamp(), history: [entry("created")],
        });
        await notify({ userIds: [assignee.id], type: "assigned", title: "New task assigned", message: `${profile.name} assigned you "${data.title}" (${PRIORITIES[data.priority].label} priority)`, taskId: ref.id });
        toast.success("Task created & assignee notified");
        onSaved?.(ref.id);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Could not save the task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit task" : "Create a new task"} wide>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" required maxLength={120} value={form.title} onChange={set("title")} placeholder="e.g. Configure daily server backups" autoFocus />
        </div>
        <div>
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" value={form.description} onChange={set("description")} placeholder="What needs to be done, acceptance criteria, useful links…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="assignee">Assign to</Label>
            <Select id="assignee" required value={form.assigneeId} onChange={set("assigneeId")}>
              <option value="">Select a team member…</option>
              {users.slice().sort((a, b) => a.name.localeCompare(b.name)).map((u) => (
                <option key={u.id} value={u.id}>{u.name}{u.role === "admin" ? " (admin)" : ""}</option>
              ))}
            </Select>
            {form.assigneeId && (
              <p className={`mt-1.5 flex items-center gap-1 text-xs ${openCount >= 5 ? "text-amber-600" : "text-slate-500"}`}>
                {openCount >= 5 && <AlertTriangle className="size-3.5" />}
                Currently has {openCount} open task{openCount === 1 ? "" : "s"}{openCount >= 5 ? " — consider someone else" : ""}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" value={form.priority} onChange={set("priority")}>
              {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input id="deadline" type="datetime-local" required value={form.deadline} onChange={set("deadline")} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create & notify"}</Button>
        </div>
      </form>
    </Modal>
  );
}
