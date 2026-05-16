import { useState, useEffect, React } from "react";
import "./popup_styles.css";

function ConfigModal({ props, baseURL, onClose }) {
  const [cronTime, setCronTime] = useState();
  const [updateAllSuccess, setUpdateAllSuccess] = useState(false);
  const [restoreFilePath, setRestoreFilePath] = useState();
  /* Close the dialog window */
  const HandleClose = () => {
    onClose();
  };

  /* Get the "Update all prices" time from BE. */
  useEffect(() => {
    let ignore = false;
    if (!ignore) {getData(baseURL)}
    return () => { ignore = true; }
  }, [baseURL]);

  async function getData(baseURL) {
    const url = baseURL + "/cron_time/";
      const response = await fetch(url);
      let json = await response.json();
      setCronTime(json["cron_time"]);
  }

  return (
    <div className="popup_overlay">
      <div className="popup_modal new_investment_modal">
        <h2 className="popup_heading">Administration Options</h2>
        <p>
        </p>
        <table className="popup_modal_table">
          <tbody>
            <tr>
              <td className="popup_modal_table_label">Backup DB</td>
              <td className="popup_modal_table_input">
                <button
                  className="popup_modal_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetch(baseURL + "/backup_db/", {
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                      },
                    });
                  }}
                >
                  Backup Now
                </button>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Restore DB</td>
              <td className="popup_modal_table_input">
              <label for="img"  class="popup_modal_input">Choose File</label>
              <input 
                  type="file" 
                  className="popup_modal_button"
                  id="img" 
                  style={{ display: "none" }}
                  onChange={(e) => {
                    e.stopPropagation();
                    fetch((`${baseURL}/restore_db/${e.target.value.replace("C:\\fakepath\\", "")}/`), {
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                      },
                    });
                  }}
                />
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Fixtures</td>
              <td className="popup_modal_table_input">
                <button
                  className="popup_modal_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetch(baseURL + "/generate_fixtures/", {
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                      },
                    });
                  }}
                >
                  Generate
                </button>
              </td>
            </tr>
            <tr>
              <td className="popup_modal_table_label">Update Prices</td>
              <td className="popup_modal_table_input">
                <button
                  className="popup_modal_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetch(baseURL + "/update_all/", {
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                      },
                    }).then(function (a) {
                      setUpdateAllSuccess(true)
                  })
                  }}
                >
                  Update {updateAllSuccess && "✓"}
                </button>
              </td>
            </tr>
            <tr>
              <td>Auto-Update</td>
              <td>
                <input 
                  className="popup_modal_time" 
                  type="time" 
                  id="update_time" 
                  defaultValue={cronTime}
                  required 
                  onChange={(e) => {
                    e.stopPropagation();
                    setCronTime(e.target.value);
                  }}
                />
              </td>
              <td>
                <button 
                className="popup_modal_button"
                onClick={(e) => {
                  e.stopPropagation();
                  fetch(baseURL + "/cron_time/", {
                    method: "POST",
                    headers: {
                      Accept: "application/json",
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(cronTime),
                  });
                }}
                >
                  Set
                </button>
              </td>
            </tr>
          </tbody>
        </table>
          <div
            className="cancel"
            style={{ marginRight: "3rem" }}
            onClick={(e) => {
              e.stopPropagation();
              HandleClose();
            }}
          >
            Close
        </div>
      </div>
    </div>
  );
}

export default ConfigModal;
