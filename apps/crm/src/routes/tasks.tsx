import { createFileRoute } from "@tanstack/react-router";
import { TaskForm, TaskList } from "@/components/task-list";
import { useWorkspace } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useTasks } from "@/lib/queries";

export const Route = createFileRoute("/tasks")({ component: Tasks });

function Tasks() {
  const { workspace } = useWorkspace();
  const { t } = useI18n();
  const tasks = useTasks(workspace.id);
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">{t("tasks")}</h1>
      <div className="card p-4"><TaskForm workspaceId={workspace.id} /></div>
      {tasks.isPending && <p className="text-sm text-muted" role="status">{t("loading")}</p>}
      {tasks.isError && <p className="text-sm text-danger" role="alert">{t("loadError")}</p>}
      {tasks.data && <TaskList tasks={tasks.data} workspaceId={workspace.id} showLead />}
    </section>
  );
}
