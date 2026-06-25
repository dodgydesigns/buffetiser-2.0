import { ReactNode, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BackupRoundedIcon from "@mui/icons-material/BackupRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

type AdminDialogProps = {
  open: boolean;
  baseURL: string;
  onClose: () => void;
};

type Feedback = {
  severity: "success" | "error";
  message: string;
} | null;

type RestoreStatus = {
  state: "idle" | "running" | "succeeded" | "failed";
  message?: string;
};

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: {
      description: string;
      accept: Record<string, string[]>;
    }[];
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

export default function AdminDialog({
  open,
  baseURL,
  onClose,
}: AdminDialogProps) {
  const [cronTime, setCronTime] = useState("");
  const [loadingTime, setLoadingTime] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const supportsSavePicker =
    typeof window !== "undefined" &&
    typeof (window as SaveFilePickerWindow).showSaveFilePicker === "function";

  useEffect(() => {
    if (!open) return;

    setFeedback(null);
    setLoadingTime(true);

    async function getData() {
      try {
        const scheduleResponse = await fetch(`${baseURL}/cron_time/`);
        if (!scheduleResponse.ok) {
          throw new Error(
            `Failed to fetch update time (${scheduleResponse.status})`
          );
        }
        const json = await scheduleResponse.json();
        setCronTime(json.cron_time ?? "");
      } catch (error) {
        setFeedback({
          severity: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not load the automatic update time.",
        });
      } finally {
        setLoadingTime(false);
      }
    }

    getData();
  }, [baseURL, open]);

  async function post(
    action: string,
    endpoint: string,
    successMessage: string,
    body?: unknown
  ) {
    setPendingAction(action);
    setFeedback(null);

    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      setFeedback({ severity: "success", message: successMessage });
    } catch (error) {
      setFeedback({
        severity: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function downloadBackup() {
    if (
      !supportsSavePicker &&
      !window.confirm(
        "This browser cannot show a Save As location picker. The backup will " +
          "use your browser's configured download folder. Continue?"
      )
    ) {
      return;
    }

    setPendingAction("backup");
    setFeedback(null);

    try {
      const response = await fetch(`${baseURL}/backup_db/`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Backup failed (${response.status})`);
      }

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="?([^"]+)"?/)?.[1] ??
        "buffetiser-backup.dump";
      const backup = await response.blob();
      const saveFilePicker = (window as SaveFilePickerWindow).showSaveFilePicker;

      if (saveFilePicker) {
        const handle = await saveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "PostgreSQL database backup",
              accept: {
                "application/octet-stream": [".dump", ".backup"],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(backup);
        await writable.close();
      } else {
        const url = URL.createObjectURL(backup);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      setFeedback({
        severity: "success",
        message: `Database backup saved as ${filename}.`,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setFeedback({
          severity: "error",
          message: "Backup save was cancelled.",
        });
        return;
      }
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Backup failed.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function restoreBackup(file: File) {
    if (
      !window.confirm(
        `Restore ${file.name}? This will replace the current database.`
      )
    ) {
      return;
    }

    setPendingAction("restore");
    setFeedback(null);
    const formData = new FormData();
    formData.append("backup", file);

    try {
      const response = await fetch(`${baseURL}/restore_db/`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Restore failed (${response.status})`);
      }
      setFeedback({
        severity: "success",
        message: "Database restore started. Please keep this window open…",
      });
      await waitForRestore();
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Restore failed.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function waitForRestore() {
    let shouldPoll = true;
    while (shouldPoll) {
      await new Promise((resolve) => window.setTimeout(resolve, 2000));

      const response = await fetch(`${baseURL}/restore_db/status`);
      if (!response.ok) {
        setFeedback({
          severity: "success",
          message: "Database restore finished. Reloading…",
        });
        window.setTimeout(() => window.location.reload(), 900);
        shouldPoll = false;
        return;
      }

      const status = (await response.json()) as RestoreStatus;
      if (status.state === "running") {
        setFeedback({
          severity: "success",
          message: "Database restore is still running…",
        });
        continue;
      }

      if (status.state === "succeeded") {
        setFeedback({
          severity: "success",
          message: "Database restored successfully. Reloading…",
        });
        window.setTimeout(() => window.location.reload(), 900);
        shouldPoll = false;
        return;
      }

      if (status.state === "failed") {
        throw new Error(status.message || "Restore failed.");
      }
    }
  }

  const isBusy = pendingAction !== null;

  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "#f7fafc",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: { xs: 2.5, sm: 3.5 },
          py: 3,
          color: "white",
          background:
            "linear-gradient(135deg, #143449 0%, #0f4c75 60%, #3282b8 100%)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.22)",
          }}
        >
          <AdminPanelSettingsRoundedIcon fontSize="large" />
        </Box>
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            Administrator
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.25 }}>
            Database maintenance and automatic price updates
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3.5 } }}>
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1.2 }}
        >
          Database
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 2,
            mt: 1,
            mb: 3,
          }}
        >
          <AdminCard
            icon={<BackupRoundedIcon />}
            title="Back up"
            description={
              supportsSavePicker
                ? "Create a database backup and choose where to save it."
                : "Download a database backup using your browser's download settings."
            }
          >
            <ActionButton
              busy={pendingAction === "backup"}
              disabled={isBusy}
              onClick={downloadBackup}
            >
              {supportsSavePicker ? "Choose location" : "Download backup"}
            </ActionButton>
          </AdminCard>

          <AdminCard
            icon={<RestoreRoundedIcon />}
            title="Restore"
            description="Restore the database from a previous backup."
          >
            <Button
              variant="outlined"
              component="label"
              disabled={isBusy}
              startIcon={
                pendingAction === "restore" ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              Choose backup
              <input
                hidden
                type="file"
                accept=".dump,.backup,.bak,application/octet-stream"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void restoreBackup(file);
                  event.target.value = "";
                }}
              />
            </Button>
          </AdminCard>

        </Box>

        <Typography
          variant="overline"
          sx={{
            mt: 3,
            color: "text.secondary",
            fontWeight: 700,
            letterSpacing: 1.2,
          }}
        >
          Market data
        </Typography>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <AdminCard
            horizontal
            icon={<SyncRoundedIcon />}
            title="Update prices"
            description="Fetch the latest price for every active investment."
          >
            <ActionButton
              busy={pendingAction === "prices"}
              disabled={isBusy}
              onClick={() =>
                post("prices", "/update_all/", "Prices updated successfully.")
              }
            >
              Update now
            </ActionButton>
          </AdminCard>

          <AdminCard
            horizontal
            icon={<ScheduleRoundedIcon />}
            title="Automatic updates"
            description="Choose the daily time used to refresh market prices."
          >
            <Stack direction="row" spacing={1}>
              <TextField
                type="time"
                size="small"
                value={cronTime}
                disabled={loadingTime || isBusy}
                onChange={(event) => setCronTime(event.target.value)}
                slotProps={{
                  htmlInput: { "aria-label": "Automatic update time" },
                }}
                sx={{ width: 130, backgroundColor: "white" }}
              />
              <ActionButton
                busy={pendingAction === "schedule"}
                disabled={loadingTime || isBusy || !cronTime}
                onClick={() =>
                  post(
                    "schedule",
                    "/cron_time/",
                    `Automatic updates set for ${cronTime}.`,
                    cronTime
                  )
                }
              >
                Save
              </ActionButton>
            </Stack>
          </AdminCard>
        </Stack>

        {feedback && (
          <Alert
            severity={feedback.severity}
            onClose={() => setFeedback(null)}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            {feedback.message}
          </Alert>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3.5 },
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "white",
        }}
      >
        <Button onClick={onClose} disabled={isBusy} sx={{ px: 3 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AdminCard({
  icon,
  title,
  description,
  children,
  horizontal = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  horizontal?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: horizontal ? { xs: "column", sm: "row" } : "column",
        alignItems: horizontal ? { xs: "stretch", sm: "center" } : "stretch",
        gap: 2,
        minHeight: horizontal ? "auto" : 190,
        p: 2.25,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "white",
        boxShadow: "0 4px 18px rgba(20, 52, 73, 0.06)",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(20, 52, 73, 0.1)",
        },
      }}
    >
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          width: 42,
          height: 42,
          flexShrink: 0,
          borderRadius: 2,
          color: "#0f4c75",
          backgroundColor: "rgba(50, 130, 184, 0.12)",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
          {description}
        </Typography>
      </Box>
      <Box sx={{ mt: horizontal ? 0 : "auto", flexShrink: 0 }}>{children}</Box>
    </Box>
  );
}

function ActionButton({
  busy,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { busy: boolean }) {
  return (
    <Button
      variant="contained"
      disableElevation
      startIcon={
        busy ? <CircularProgress size={16} color="inherit" /> : undefined
      }
      {...props}
    >
      {children}
    </Button>
  );
}
