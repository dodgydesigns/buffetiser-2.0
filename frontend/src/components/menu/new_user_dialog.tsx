import { FormEvent, useEffect, useState } from "react";
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
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";

type NewUserDialogProps = {
  open: boolean;
  baseURL: string;
  onClose: () => void;
};

export default function NewUserDialog({
  open,
  baseURL,
  onClose,
}: NewUserDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setDisplayName("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setFeedback(null);
    }
  }, [open]);

  async function createUser(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setFeedback({
        severity: "error",
        message: "The passwords do not match.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`${baseURL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          username,
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || `Could not create user (${response.status})`);
      }

      setDisplayName("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setFeedback({
        severity: "success",
        message: `${data.display_name} can now sign in with username ${data.username}.`,
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: error instanceof Error ? error.message : "Could not create user.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        },
      }}
    >
      <form onSubmit={createUser}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 3,
            py: 2.5,
            color: "white",
            background:
              "linear-gradient(135deg, #143449 0%, #0f4c75 65%, #3282b8 100%)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.14)",
            }}
          >
            <PersonAddRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              New User
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Create a separate, private portfolio account
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              required
            />
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              helperText="At least 3 characters"
              slotProps={{ htmlInput: { minLength: 3 } }}
              required
            />
            <TextField
              type="password"
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              helperText="At least 10 characters"
              slotProps={{ htmlInput: { minLength: 10 } }}
              required
            />
            <TextField
              type="password"
              label="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              error={Boolean(confirmPassword && password !== confirmPassword)}
              required
            />
            {feedback && (
              <Alert severity={feedback.severity}>{feedback.message}</Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, backgroundColor: "#f7fafc" }}>
          <Button onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              saving ||
              !displayName.trim() ||
              username.trim().length < 3 ||
              password.length < 10 ||
              password !== confirmPassword
            }
            startIcon={
              saving ? <CircularProgress size={16} color="inherit" /> : undefined
            }
          >
            Create user
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
