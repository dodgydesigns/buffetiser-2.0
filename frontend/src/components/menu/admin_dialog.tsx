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
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
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

export default function AdminDialog({
  open,
  baseURL,
  onClose,
}: AdminDialogProps) {
  const [cronTime, setCronTime] = useState("");
  const [loadingTime, setLoadingTime] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!open) return;

    setFeedback(null);
    setLoadingTime(true);

    async function getData() {
      try {
        const response = await fetch(`${baseURL}/cron_time/`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch update time (${response.status})`
          );
        }
        const json = await response.json();
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
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
            mt: 1,
            mb: 3,
          }}
        >
          <AdminCard
            icon={<BackupRoundedIcon />}
            title="Back up"
            description="Create a safe copy of the current database."
          >
            <ActionButton
              busy={pendingAction === "backup"}
              disabled={isBusy}
              onClick={() =>
                post("backup", "/backup_db/", "Database backup completed.")
              }
            >
              Back up now
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
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void post(
                    "restore",
                    `/restore_db/${encodeURIComponent(file.name)}/`,
                    "Database restored successfully."
                  );
                  event.target.value = "";
                }}
              />
            </Button>
          </AdminCard>

          <AdminCard
            icon={<AutoAwesomeRoundedIcon />}
            title="Fixtures"
            description="Generate sample data for development and testing."
          >
            <ActionButton
              busy={pendingAction === "fixtures"}
              disabled={isBusy}
              onClick={() =>
                post(
                  "fixtures",
                  "/generate_fixtures/",
                  "Fixtures generated successfully."
                )
              }
            >
              Generate
            </ActionButton>
          </AdminCard>
        </Box>

        <Typography
          variant="overline"
          sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1.2 }}
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
