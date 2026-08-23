// ======================================================
// PEGASUS PATROL
// BUILD 008
// OFFLINE FOUNDATION
// ======================================================

window.addEventListener(
  "load",
  function () {

    updateConnectionStatus();


    // ==================================================
    // OPEN OFFLINE DATABASE ON STARTUP
    // ==================================================

    openPegasusDB()
      .then(
        async function () {

          const databaseStatus =
            document.getElementById(
              "databaseStatus"
            );


          await showOfflineDataSummary();


          const testSites =
            await getOfflineRecords(
              "sites"
            );

          const testRoutes =
            await getOfflineRecords(
              "routes"
            );

          const testCheckpoints =
            await getOfflineRecords(
              "checkpoints"
            );


          if (databaseStatus) {

            databaseStatus.textContent =
              "✅ DB open — " +
              testSites.length +
              " sites, " +
              testRoutes.length +
              " routes, " +
              testCheckpoints.length +
              " checkpoints";

          }

        }
      )
      .catch(
        function (error) {

          const databaseStatus =
            document.getElementById(
              "databaseStatus"
            );

          if (databaseStatus) {

            databaseStatus.textContent =
              "❌ Offline database error";

          }

          console.error(
            "Pegasus database error:",
            error
          );

        }
      );


    // ==================================================
    // CONNECTION RESTORED
    // ==================================================

    window.addEventListener(
      "online",
      function () {

        updateConnectionStatus();

        console.log(
          "Pegasus connection restored."
        );

      }
    );


    // ==================================================
    // CONNECTION LOST
    // ==================================================

    window.addEventListener(
      "offline",
      function () {

        updateConnectionStatus();

        console.log(
          "Pegasus is offline."
        );

      }
    );


    // ==================================================
    // SERVICE WORKER
    // ==================================================

    if (
      "serviceWorker" in navigator
    ) {

      navigator.serviceWorker
        .register(
          "sw.js"
        )
        .then(
          function () {

            console.log(
              "Pegasus service worker registered."
            );

          }
        )
        .catch(
          function (error) {

            console.error(
              "Service worker error:",
              error
            );

          }
        );

    }

  }
);

// ======================================================
// CONNECTION STATUS
// ======================================================

function updateConnectionStatus() {

  const box =
    document.getElementById(
      "connectionStatus"
    );

  if (!box) {
    return;
  }


  if (navigator.onLine) {

    box.textContent =
      "🟢 Online";

    box.className =
      "online";

  } else {

    box.textContent =
      "🟠 Offline";

    box.className =
      "offline";

  }

}

// ======================================================
// MANUAL PATROL DATA SYNC
// ======================================================

async function manualPatrolSync() {

  const statusBox =
    document.getElementById(
      "syncStatus"
    );

  if (!navigator.onLine) {

    statusBox.textContent =
      "🟠 Offline — cannot sync yet.";

    return;

  }

  statusBox.textContent =
    "🔄 Syncing patrol data...";

  try {

    const result =
      await syncPatrolData();

    statusBox.textContent =
  "🟢 Patrol data synced";

await showOfflineDataSummary();

  } catch (error) {

    statusBox.textContent =
      "❌ Sync failed: " +
      (
        error.message ||
        String(error)
      );

  }

}

// ======================================================
// SHOW OFFLINE DATA COUNTS
// ======================================================

async function showOfflineDataSummary() {

  const box =
    document.getElementById(
      "offlineDataSummary"
    );

  try {

    const sites =
      await getOfflineRecords(
        "sites"
      );

    const routes =
      await getOfflineRecords(
        "routes"
      );

    const checkpoints =
      await getOfflineRecords(
        "checkpoints"
      );

    box.textContent =
      "Offline data ready: " +
      sites.length +
      " site(s), " +
      routes.length +
      " route(s), " +
      checkpoints.length +
      " checkpoint(s).";

  } catch (error) {

    box.textContent =
      "Unable to read offline patrol data.";

  }

}