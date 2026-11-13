import { Link } from "@tanstack/react-router";
import { Check, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { isoDate, sortTasks, taskGroup, type Task, type TaskGroup } from "@/lib/crm";
import { taskGroupLabel, useI18n } from "@/lib/i18n";
import { useAddTask, useDeleteTask, useToggleTask } from "@/lib/queries";

/** Form to add a task, optionally tied to one request. */
export function TaskForm({ workspaceId, leadId = null }: { workspaceId: string; leadId?: string | null }) {
  const { t } = useI18n();
  const add = useAddTask(workspaceId);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    add.mutate({ title: clean, due_date: due || null, lead_id: leadId }, { onSuccess: () => { setTitle(""); setDue(""); } });
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="min-w-48 flex-1">
        <span className="mb-1 block text-xs font-semibold text-muted">{t("newTask")}</span>
        <input className="field" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("taskPlaceholder")} />
      </label>
      <label>
        <span className="mb-1 block text-xs font-semibold text-muted">{t("dueDate")}</span>
        <input type="date" className="field" value={due} onChange={(e) => setDue(e.target.value)} />
      </label>
      <button type="submit" className="btn-primary" disabled={add.isPending || !title.trim()}><Plus className="h-4 w-4" aria-hidden="true" />{t("add")}</button>
      {add.isError && <p className="w-full text-sm text-danger" role="alert">{t("saveError")}</p>}
    </form>
  );
}

/** Tasks grouped by due state; `showLead` adds a link to the request on the overview page. */
export function TaskList({ tasks, workspaceId, showLead = false }: { tasks: Task[]; workspaceId: string; showLead?: boolean }) {
  const { t, lang, formatDate } = useI18n();
  const toggle = useToggleTask(workspaceId);
  const remove = useDeleteTask(workspaceId);
  const today = isoDate(new Date());
  const groups = new Map<TaskGroup, Task[]>();
  for (const task of sortTasks(tasks)) {
    const group = taskGroup(task, today);
    groups.set(group, [...(groups.get(group) ?? []), task]);
  }
  if (tasks.length === 0) return <p className="text-sm text-muted">{t("noTasks")}</p>;
  const order: TaskGroup[] = ["overdue", "today", "upcoming", "someday", "done"];
  return (
    <div className="space-y-4">
      {(toggle.isError || remove.isError) && <p className="text-sm text-danger" role="alert">{t("saveError")}</p>}
      {order.filter((g) => groups.has(g)).map((group) => (
        <div key={group}>
          <h3 className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${group === "overdue" ? "text-danger" : "text-muted"}`}>{taskGroupLabel[group][lang]}</h3>
          <ul className="space-y-1.5">
            {groups.get(group)!.map((task) => (
              <li key={task.id} className="card flex items-center gap-3 px-3 py-2">
                <button type="button" onClick={() => toggle.mutate(task)} aria-label={task.done_at ? t("markOpen") : t("markDone")} title={task.done_at ? t("markOpen") : t("markDone")}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${task.done_at ? "border-ok text-ok" : "border-line text-transparent hover:text-muted"}`}>
                  {task.done_at ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                </button>
                <span className={`flex-1 text-sm ${task.done_at ? "text-muted line-through" : ""}`}>{task.title}</span>
                {task.due_date && <span className={`text-xs ${group === "overdue" ? "font-semibold text-danger" : "text-muted"}`}>{formatDate(task.due_date)}</span>}
                {showLead && task.lead_id && <Link to="/leads/$id" params={{ id: task.lead_id }} className="text-xs font-semibold underline">{t("forRequest")}</Link>}
                <button type="button" onClick={() => remove.mutate(task.id)} aria-label={t("deleteTask")} title={t("deleteTask")} className="text-muted hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
