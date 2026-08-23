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
          
          await loadOfflinePatrolSelectors();


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

await loadOfflinePatrolSelectors();

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

// ======================================================
// LOAD OFFLINE SITE / ROUTE SELECTORS
// ======================================================

async function loadOfflinePatrolSelectors() {

  const siteBox =
    document.getElementById(
      "offlineSite"
    );

  const routeBox =
    document.getElementById(
      "offlineRoute"
    );

  if (
    !siteBox ||
    !routeBox
  ) {
    return;
  }


  const sites =
    await getOfflineRecords(
      "sites"
    );

  const routes =
    await getOfflineRecords(
      "routes"
    );


  siteBox.innerHTML =
    '<option value="">Select Site</option>';

  routeBox.innerHTML =
    '<option value="">Select Route</option>';


  sites.forEach(
    function (site) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        site.siteID;

      option.textContent =
        site.name;

      siteBox.appendChild(
        option
      );

    }
  );


  siteBox.addEventListener(
    "change",
    function () {

      const selectedSiteID =
        siteBox.value;

      routeBox.innerHTML =
        '<option value="">Select Route</option>';


      routes
        .filter(
          function (route) {

            return (
              route.siteID ===
              selectedSiteID
            );

          }
        )
        .forEach(
          function (route) {

            const option =
              document.createElement(
                "option"
              );

            option.value =
              route.routeID;

            option.textContent =
              route.name;

            routeBox.appendChild(
              option
            );

          }
        );

    }
  );

}

// ======================================================
// START OFFLINE PATROL
// ======================================================

async function startOfflinePatrol() {

  const siteBox =
    document.getElementById(
      "offlineSite"
    );

  const routeBox =
    document.getElementById(
      "offlineRoute"
    );

  const statusBox =
    document.getElementById(
      "offlinePatrolStatus"
    );


  const siteID =
    siteBox.value;

  const routeID =
    routeBox.value;


  if (
    !siteID ||
    !routeID
  ) {

    statusBox.textContent =
      "Select a site and route.";

    return;

  }


  const routes =
    await getOfflineRecords(
      "routes"
    );

  const checkpoints =
    await getOfflineRecords(
      "checkpoints"
    );


  const selectedRoute =
    routes.find(
      function (route) {

        return (
          route.routeID ===
          routeID
        );

      }
    );


  const routeCheckpoints =
    checkpoints
      .filter(
        function (checkpoint) {

          return (
            checkpoint.routeID ===
            routeID
          );

        }
      )
      .sort(
        function (a, b) {

          return (
            Number(a.order || 0) -
            Number(b.order || 0)
          );

        }
      );


  const patrolID =
    "OFFLINE-" +
    Date.now();


  const patrol = {

    patrolID:
      patrolID,

    siteID:
      siteID,

    routeID:
      routeID,

    routeName:
      selectedRoute
        ? selectedRoute.name
        : "",

    startedAt:
      new Date().toISOString(),

    status:
      "Active",

    checkpoints:
      routeCheckpoints,

    syncStatus:
      "Pending"

  };


  try {

  statusBox.textContent =
    "Starting patrol...";

  await saveOfflineRecord(
    "activePatrols",
    patrol
  );

  statusBox.textContent =
    "▶ Patrol started — " +
    routeCheckpoints.length +
    " checkpoint(s) loaded.";

} catch (error) {

    statusBox.textContent =
      "❌ Patrol start error: " +
      (
        error && error.message
          ? error.message
          : String(error)
      );

  }

}