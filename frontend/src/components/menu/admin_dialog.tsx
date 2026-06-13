import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type AdminDialogProps = {
  open: boolean;
  baseURL: string;
  onClose: () => void;
};

export default function AdminDialog({
  open,
  baseURL,
  onClose,
}: AdminDialogProps) {
  const [cronTime, setCronTime] = useState("");
  const [updateAllSuccess, setUpdateAllSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function getData() {
      const response = await fetch(`${baseURL}/cron_time/`);
      const json = await response.json();
      setCronTime(json.cron_time);
    }

    getData();
  }, [baseURL, open]);

  async function post(endpoint: string, body?: unknown) {
    await fetch(`${baseURL}${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Administration Options</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <SettingRow label="Backup DB">
            <Button variant="contained" onClick={() => post("/backup_db/")}>
              Backup Now
            </Button>
          </SettingRow>

          <SettingRow label="Restore DB">
            <Button variant="outlined" component="label">
              Choose File
              <input
                hidden
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  post(`/restore_db/${file.name}/`);
                }}
              />
            </Button>
          </SettingRow>

          <SettingRow label="Fixtures">
            <Button
              variant="contained"
              onClick={() => post("/generate_fixtures/")}
            >
              Generate
            </Button>
          </SettingRow>

          <SettingRow label="Update Prices">
            <Button
              variant="contained"
              color={updateAllSuccess ? "success" : "primary"}
              onClick={async () => {
                await post("/update_all/");
                setUpdateAllSuccess(true);
              }}
            >
              Update {updateAllSuccess && "✓"}
            </Button>
          </SettingRow>

          <SettingRow label="Auto-Update">
            <Box display="flex" gap={2}>
              <TextField
                type="time"
                size="small"
                value={cronTime}
                onChange={(e) => setCronTime(e.target.value)}
              />

              <Button
                variant="contained"
                onClick={() => post("/cron_time/", cronTime)}
              >
                Set
              </Button>
            </Box>
          </SettingRow>

          {updateAllSuccess && (
            <Alert severity="success">Prices updated successfully.</Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      display="grid"
      gridTemplateColumns="160px 1fr"
      alignItems="center"
      gap={2}
    >
      <Typography fontWeight={600}>{label}</Typography>
      <Box>{children}</Box>
    </Box>
  );
}










// import { useState, useEffect } from "react";
// import "./popup_styles.css";

// type ConfigModalProps = {
//   baseURL: string;
//   onClose: () => void;
// };

// function ConfigModal({ baseURL, onClose }: ConfigModalProps) {
//   const [cronTime, setCronTime] = useState("");
//   const [updateAllSuccess, setUpdateAllSuccess] = useState(false);
//   /* Close the dialog window */
//   const handleClose = () => {
//     onClose();
//   };

//   /* Get the "Update all prices" time from BE. */
//   useEffect(() => {
//     let ignore = false;
//     if (!ignore) {getData(baseURL)}
//     return () => { ignore = true; }
//   }, [baseURL]);

//   async function getData(baseURL: string) {
//     const url = baseURL + "/cron_time/";
//       const response = await fetch(url);
//       const json = await response.json();
//       setCronTime(json["cron_time"]);
//   }

//   return (
//     <div className="popup_overlay">
//       <div className="popup_modal new_investment_modal">
//         <h2 className="popup_heading">Administration Options</h2>
//         <p>
//         </p>
//         <table className="popup_modal_table">
//           <tbody>
//             <tr>
//               <td className="popup_modal_table_label">Backup DB</td>
//               <td className="popup_modal_table_input">
//                 <button
//                   className="popup_modal_button"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     fetch(baseURL + "/backup_db/", {
//                       method: "POST",
//                       headers: {
//                         Accept: "application/json",
//                         "Content-Type": "application/json",
//                       },
//                     });
//                   }}
//                 >
//                   Backup Now
//                 </button>
//               </td>
//             </tr>
//             <tr>
//               <td className="popup_modal_table_label">Restore DB</td>
//               <td className="popup_modal_table_input">
//               <label htmlFor="img" className="popup_modal_input">Choose File</label>
//               <input 
//                   type="file" 
//                   className="popup_modal_button"
//                   id="img" 
//                   style={{ display: "none" }}
//                   onChange={(e) => {
//                     e.stopPropagation();
//                     fetch((`${baseURL}/restore_db/${e.target.value.replace("C:\\fakepath\\", "")}/`), {
//                       method: "POST",
//                       headers: {
//                         Accept: "application/json",
//                         "Content-Type": "application/json",
//                       },
//                     });
//                   }}
//                 />
//               </td>
//             </tr>
//             <tr>
//               <td className="popup_modal_table_label">Fixtures</td>
//               <td className="popup_modal_table_input">
//                 <button
//                   className="popup_modal_button"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     fetch(baseURL + "/generate_fixtures/", {
//                       method: "POST",
//                       headers: {
//                         Accept: "application/json",
//                         "Content-Type": "application/json",
//                       },
//                     });
//                   }}
//                 >
//                   Generate
//                 </button>
//               </td>
//             </tr>
//             <tr>
//               <td className="popup_modal_table_label">Update Prices</td>
//               <td className="popup_modal_table_input">
//                 <button
//                   className="popup_modal_button"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     fetch(baseURL + "/update_all/", {
//                       method: "POST",
//                       headers: {
//                         Accept: "application/json",
//                         "Content-Type": "application/json",
//                       },
//                     }).then(function () {
//                       setUpdateAllSuccess(true)
//                   })
//                   }}
//                 >
//                   Update {updateAllSuccess && "✓"}
//                 </button>
//               </td>
//             </tr>
//             <tr>
//               <td>Auto-Update</td>
//               <td>
//                 <input 
//                   className="popup_modal_time" 
//                   type="time" 
//                   id="update_time" 
//                   defaultValue={cronTime}
//                   required 
//                   onChange={(e) => {
//                     e.stopPropagation();
//                     setCronTime(e.target.value);
//                   }}
//                 />
//               </td>
//               <td>
//                 <button 
//                 className="popup_modal_button"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   fetch(baseURL + "/cron_time/", {
//                     method: "POST",
//                     headers: {
//                       Accept: "application/json",
//                       "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify(cronTime),
//                   });
//                 }}
//                 >
//                   Set
//                 </button>
//               </td>
//             </tr>
//           </tbody>
//         </table>
//           <button
//             type="button"
//             className="cancel"
//             style={{ marginRight: "3rem" }}
//             onClick={(e) => {
//               e.stopPropagation();
//               handleClose();
//             }}
//           >
//             Close
//         </button>
//       </div>
//     </div>
//   );
// }

// export default ConfigModal;
