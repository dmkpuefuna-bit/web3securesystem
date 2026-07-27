import { AdminDataViewer } from "./AdminDataViewer";

export function AdminNotifications() {
  return (
    <AdminDataViewer
      title="Notifications"
      description="Review platform notifications and messaging events."
      table="notifications"
      searchKeys={["title", "message", "type"]}
      columns={[
        { key: "title", label: "Title" },
        { key: "message", label: "Message" },
        { key: "type", label: "Type" },
        {
          key: "is_read",
          label: "Read",
          render: (row) => (row.is_read ? "Yes" : "No"),
        },
        {
          key: "created_at",
          label: "Created",
          render: (row) =>
            new Date(String(row.created_at ?? "")).toLocaleString(),
        },
      ]}
    />
  );
}
