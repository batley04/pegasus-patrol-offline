// ======================================================
// PEGASUS PATROL
// BUILD 008
// OFFLINE FOUNDATION
// ======================================================

let currentOfflinePatrol = null;

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
          await showPendingSyncSummary();
          await loadOfflinePatrolSelectors();

 const activePatrolRecords =
            await getOfflineRecords(
              "activePatrols"
            );

const savedActivePatrol =
  activePatrolRecords
    .filter(
      function (patrol) {

        return (
          patrol.status ===
          "Active"
        );

      }
    )
    .sort(
      function (a, b) {

        return (
          new Date(
            b.startedAt || 0
          ).getTime() -
          new Date(
            a.startedAt || 0
          ).getTime()
        );

      }
    )[0] || null;



          if (savedActivePatrol) {

            currentOfflinePatrol =
              savedActivePatrol;

          }

          if (savedActivePatrol) {

            const patrolCard =
              document.getElementById(
                "activePatrolCard"
              );

            const routeTitle =
              document.getElementById(
                "activePatrolRoute"
              );

            const progressBox =
              document.getElementById(
                "activePatrolProgress"
              );

            const checkpointName =
              document.getElementById(
                "activeCheckpointName"
              );


            const completedCount =
              savedActivePatrol.checkpoints
                .filter(
                  function (checkpoint) {

                    return (
                      checkpoint.status ===
                      "Completed"
                    );

                  }
                )
                .length;


            if (patrolCard) {

              patrolCard.style.display =
                "block";

            }


            if (routeTitle) {

              routeTitle.textContent =
                savedActivePatrol.routeName ||
                "Active Patrol";

            }


            if (progressBox) {

              progressBox.textContent =
                "Completed " +
                completedCount +
                " of " +
                savedActivePatrol.checkpoints.length;

            }

renderActivePatrolChecklist();


            if (checkpointName) {

              checkpointName.textContent =
                "Continue scanning checkpoints";

            }

          }



            if (navigator.onLine) {

            try {

              await syncPatrolData();

              await showOfflineDataSummary();

              await loadOfflinePatrolSelectors();

            } catch (error) {

              console.log(
                "Automatic patrol data refresh skipped:",
                error
              );

            }

          }

            if (navigator.onLine) {

            const pendingRecords =
              await getOfflineRecords(
                "pendingSync"
              );


            for (
              const syncRecord of pendingRecords
            ) {

              let synced =
                await confirmOfflinePatrolSync(
                  syncRecord.patrol.patrolID
                );


              if (!synced) {

                try {

                  await syncPendingPatrol(
                    syncRecord
                  );

                } catch (error) {

                  console.log(
                    "Patrol POST response not confirmed directly."
                  );

                }


                synced =
                  await confirmOfflinePatrolSync(
                    syncRecord.patrol.patrolID
                  );

              }


              if (synced) {

                await deleteOfflineRecord(
                  "pendingSync",
                  syncRecord.syncID
                );

              }

            }


            await showPendingSyncSummary();

          }


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
  async function () {

    updateConnectionStatus();

    console.log(
      "Pegasus connection restored."
    );


    try {

      const pendingRecords =
        await getOfflineRecords(
          "pendingSync"
        );


      for (
        const syncRecord of pendingRecords
      ) {
let synced =
          false;


        try {

          await syncPendingPatrol(
            syncRecord
          );

          synced =
            true;

        } catch (error) {

          synced =
            await confirmOfflinePatrolSync(
              syncRecord.patrol.patrolID
            );

        }


 if (synced) {

          await deleteOfflineRecord(
            "pendingSync",
            syncRecord.syncID
          );

        }

      }


      await showPendingSyncSummary();

    } catch (error) {

      console.error(
        "Automatic patrol sync failed:",
        error
      );

    }

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

const pendingRecords =
      await getOfflineRecords(
        "pendingSync"
      );


    for (
      const syncRecord of pendingRecords
    ) {

      await syncPendingPatrol(
        syncRecord
      );

       await deleteOfflineRecord(
        "pendingSync",
        syncRecord.syncID
      );

    }

    statusBox.textContent =
  "🟢 Patrol data synced";

await showOfflineDataSummary();
await showPendingSyncSummary();

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

     const guards =
  await getOfflineRecords(
    "guards"
  );

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
  guards.length +
  " guard(s), " +
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

if (!currentOfflineGuard) {

  statusBox.textContent =
    "❌ Please log in before starting a patrol.";

  return;

}


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

guardID:
  currentOfflineGuard.guardID,

guardName:
  currentOfflineGuard.name,

guardRole:
  currentOfflineGuard.role,

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
  routeCheckpoints.map(
    function (checkpoint) {

      return {
        ...checkpoint,
        status: "Pending",
        scannedAt: ""
      };

    }
  ),

  syncStatus:
    "Pending"

};


currentOfflinePatrol =
  patrol;





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

const patrolCard =
  document.getElementById(
    "activePatrolCard"
  );

const routeTitle =
  document.getElementById(
    "activePatrolRoute"
  );

const progressBox =
  document.getElementById(
    "activePatrolProgress"
  );

const checkpointName =
  document.getElementById(
    "activeCheckpointName"
  );


if (patrolCard) {

  patrolCard.style.display =
    "block";

}


if (routeTitle) {

  routeTitle.textContent =
    selectedRoute
      ? selectedRoute.name
      : "Active Patrol";

}


if (progressBox) {

progressBox.textContent =
  "Completed 0 of " +
  routeCheckpoints.length;

}

renderActivePatrolChecklist();


if (checkpointName) {

checkpointName.textContent =
  "Scan checkpoints in any order";

}

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

// ======================================================
// CHECKPOINT CAMERA
// ======================================================

let checkpointCameraStream = null;



// ======================================================
// START CAMERA
// ======================================================

async function startCheckpointScanner() {

  const scannerBox =
    document.getElementById(
      "scannerBox"
    );

  const video =
    document.getElementById(
      "scannerVideo"
    );

  const statusBox =
    document.getElementById(
      "checkpointStatus"
    );


  try {

    statusBox.textContent =
      "Opening camera...";


    checkpointCameraStream =
      await navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: {
              ideal: "environment"
            }
          },
          audio: false
        });


    video.srcObject =
      checkpointCameraStream;


    await video.play();


    scannerBox.style.display =
      "block";


    statusBox.textContent =
      "📷 Camera ready — point it at the checkpoint QR code.";

     scanCheckpointFrame();


  } catch (error) {

    statusBox.textContent =
      "❌ Camera error: " +
      (
        error && error.message
          ? error.message
          : String(error)
      );

  }

}


// ======================================================
// STOP CAMERA
// ======================================================

function stopCheckpointScanner() {

  const scannerBox =
    document.getElementById(
      "scannerBox"
    );

  const video =
    document.getElementById(
      "scannerVideo"
    );


  if (
    checkpointCameraStream
  ) {

    checkpointCameraStream
      .getTracks()
      .forEach(
        function (track) {

          track.stop();

        }
      );

    checkpointCameraStream =
      null;

  }


  if (video) {

    video.srcObject =
      null;

  }


  if (scannerBox) {

    scannerBox.style.display =
      "none";

  }

}

// ======================================================
// READ CHECKPOINT QR
// ======================================================

async function scanCheckpointFrame() {

  const video =
    document.getElementById(
      "scannerVideo"
    );

  const canvas =
    document.getElementById(
      "scannerCanvas"
    );

  const statusBox =
    document.getElementById(
      "checkpointStatus"
    );


  if (
    !checkpointCameraStream ||
    !video ||
    !canvas
  ) {
    return;
  }


  if (
    video.readyState ===
    video.HAVE_ENOUGH_DATA
  ) {

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;


    const context =
      canvas.getContext(
        "2d",
        {
          willReadFrequently: true
        }
      );


    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );


    const imageData =
      context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );


    const code =
      jsQR(
        imageData.data,
        imageData.width,
        imageData.height,
        {
          inversionAttempts:
            "dontInvert"
        }
      );


    if (
      code &&
      code.data
    ) {

      const scannedCode =
        String(
          code.data
        ).trim();

       if (
  !currentOfflinePatrol ||
  !currentOfflinePatrol.checkpoints ||
  !currentOfflinePatrol.checkpoints.length
) {

  statusBox.textContent =
    "❌ No active patrol checkpoint found.";

  stopCheckpointScanner();

  return;

}


const matchedCheckpoint =
  currentOfflinePatrol.checkpoints.find(
    function (checkpoint) {

      return (
        String(
          checkpoint.qrCode || ""
        ).trim() ===
        scannedCode
      );

    }
  );


if (!matchedCheckpoint) {

  statusBox.textContent =
    "❌ This checkpoint is not part of the active route.";

  stopCheckpointScanner();

  return;

}


if (
  matchedCheckpoint.status ===
  "Completed"
) {

  statusBox.textContent =
    "⚠️ Checkpoint already scanned: " +
    matchedCheckpoint.name;

  stopCheckpointScanner();

  return;

}


matchedCheckpoint.status =
  "Completed";

matchedCheckpoint.scannedAt =
  new Date().toISOString();


await saveOfflineRecord(
  "activePatrols",
  currentOfflinePatrol
);

renderActivePatrolChecklist();


const completedCount =
  currentOfflinePatrol.checkpoints
    .filter(
      function (checkpoint) {

        return (
          checkpoint.status ===
          "Completed"
        );

      }
    )
    .length;


const progressBox =
  document.getElementById(
    "activePatrolProgress"
  );


if (progressBox) {

  progressBox.textContent =
    "Completed " +
    completedCount +
    " of " +
    currentOfflinePatrol.checkpoints.length;

}


statusBox.textContent =
  "✅ Checkpoint completed: " +
  matchedCheckpoint.name;


stopCheckpointScanner();


if (
  completedCount ===
  currentOfflinePatrol.checkpoints.length
) {

currentOfflinePatrol.status =
  "Completed";

currentOfflinePatrol.completedAt =
  new Date().toISOString();

currentOfflinePatrol.syncStatus =
  "Pending";


await saveOfflineRecord(
  "activePatrols",
  currentOfflinePatrol
);

renderActivePatrolChecklist();

const syncRecord = {

  syncID:
    "PATROL-" +
    currentOfflinePatrol.patrolID,

  type:
    "CompletedPatrol",

  patrol:
    currentOfflinePatrol,

  createdAt:
    new Date().toISOString(),

  status:
    "Pending"

};


await saveOfflineRecord(
  "pendingSync",
  syncRecord
);


await showPendingSyncSummary();

if (navigator.onLine) {

  try {

    let synced =
      await confirmOfflinePatrolSync(
        syncRecord.patrol.patrolID
      );


    if (!synced) {

      try {

        await syncPendingPatrol(
          syncRecord
        );

      } catch (error) {

        console.log(
          "Patrol POST response not confirmed directly."
        );

      }


      synced =
        await confirmOfflinePatrolSync(
          syncRecord.patrol.patrolID
        );

    }


    if (synced) {

      await deleteOfflineRecord(
        "pendingSync",
        syncRecord.syncID
      );

      await showPendingSyncSummary();

      currentOfflinePatrol.syncStatus =
        "Synced";

    }

  } catch (error) {

    console.error(
      "Immediate patrol sync failed:",
      error
    );

  }

}

  const checkpointName =
    document.getElementById(
      "activeCheckpointName"
    );

  if (checkpointName) {

    checkpointName.textContent =
      "All checkpoints completed";

  }

 const patrolCard =
    document.getElementById(
      "activePatrolCard"
    );

  const completedCard =
    document.getElementById(
      "completedPatrolCard"
    );

  const completedGuard =
    document.getElementById(
      "completedPatrolGuard"
    );

  const completedRoute =
    document.getElementById(
      "completedPatrolRoute"
    );

  const completedCheckpoints =
    document.getElementById(
      "completedPatrolCheckpoints"
    );

  const completedTime =
    document.getElementById(
      "completedPatrolTime"
    );

  const completedSync =
    document.getElementById(
      "completedPatrolSync"
    );


  if (patrolCard) {

    patrolCard.style.display =
      "none";

  }


  if (completedCard) {

    completedCard.style.display =
      "block";

  }


  if (completedGuard) {

    completedGuard.textContent =
      "Guard: " +
      currentOfflinePatrol.guardName;

  }


  if (completedRoute) {

    completedRoute.textContent =
      "Route: " +
      currentOfflinePatrol.routeName;

  }


  if (completedCheckpoints) {

    completedCheckpoints.textContent =
      "Checkpoints: " +
      currentOfflinePatrol.checkpoints.length +
      " of " +
      currentOfflinePatrol.checkpoints.length +
      " completed";

  }


  if (completedTime) {

    completedTime.textContent =
      "Completed: " +
      new Date(
        currentOfflinePatrol.completedAt
      ).toLocaleString();

  }


  if (completedSync) {

    completedSync.textContent =
      currentOfflinePatrol.syncStatus ===
        "Synced"
        ? "Sync: ✅ Synced"
        : "Sync: ⏳ Waiting to sync";

  }


  statusBox.textContent =
    "✅ Patrol complete.";

}


return;


      
    }

  }


  requestAnimationFrame(
    scanCheckpointFrame
  );

}

// ======================================================
// END PATROL EARLY
// ======================================================

async function endPatrolEarly() {

  if (
    !currentOfflinePatrol ||
    currentOfflinePatrol.status !==
      "Active"
  ) {

    alert(
      "There is no active patrol to end."
    );

    return;

  }


  const confirmed =
    window.confirm(
      "End this patrol early?\n\n" +
      "Any checkpoints not scanned will be recorded as missed."
    );


  if (!confirmed) {

    return;

  }


  stopCheckpointScanner();


  const completedCount =
    currentOfflinePatrol.checkpoints
      .filter(
        function (checkpoint) {

          return (
            checkpoint.status ===
            "Completed"
          );

        }
      )
      .length;


  currentOfflinePatrol.status =
    "Ended Early";

  currentOfflinePatrol.endedAt =
    new Date().toISOString();

  currentOfflinePatrol.syncStatus =
    "Pending";


  await saveOfflineRecord(
    "activePatrols",
    currentOfflinePatrol
  );


  const syncRecord = {

    syncID:
      "PATROL-" +
      currentOfflinePatrol.patrolID,

    type:
      "EndedEarlyPatrol",

    patrol:
      currentOfflinePatrol,

    createdAt:
      new Date().toISOString(),

    status:
      "Pending"

  };


  await saveOfflineRecord(
    "pendingSync",
    syncRecord
  );


  await showPendingSyncSummary();


  if (navigator.onLine) {

    try {

      let synced =
        await confirmOfflinePatrolSync(
          currentOfflinePatrol.patrolID
        );


      if (!synced) {

        try {

          await syncPendingPatrol(
            syncRecord
          );

        } catch (error) {

          console.log(
            "Ended patrol POST response not confirmed directly."
          );

        }


        synced =
          await confirmOfflinePatrolSync(
            currentOfflinePatrol.patrolID
          );

      }


      if (synced) {

        await deleteOfflineRecord(
          "pendingSync",
          syncRecord.syncID
        );

        currentOfflinePatrol.syncStatus =
          "Synced";

        await saveOfflineRecord(
          "activePatrols",
          currentOfflinePatrol
        );

        await showPendingSyncSummary();

      }

    } catch (error) {

      console.error(
        "Ended patrol sync failed:",
        error
      );

    }

  }


  const patrolCard =
    document.getElementById(
      "activePatrolCard"
    );


  if (patrolCard) {

    patrolCard.style.display =
      "none";

  }


  alert(
    "Patrol ended early.\n\n" +
    completedCount +
    " of " +
    currentOfflinePatrol.checkpoints.length +
    " checkpoints completed.\n\n" +
    "Unscanned checkpoints will be recorded as missed."
  );

}

// ======================================================
// RENDER ACTIVE PATROL CHECKLIST
// ======================================================

function renderActivePatrolChecklist() {

  const checklist =
    document.getElementById(
      "activePatrolChecklist"
    );


  if (!checklist) {
    return;
  }


  checklist.innerHTML =
    "";


  if (
    !currentOfflinePatrol ||
    !currentOfflinePatrol.checkpoints
  ) {

    return;

  }


  currentOfflinePatrol.checkpoints
    .forEach(
      function (checkpoint) {

        const item =
          document.createElement(
            "div"
          );


        item.textContent =
          checkpoint.status ===
            "Completed"
            ? "✅ " + checkpoint.name
            : "☐ " + checkpoint.name;


        checklist.appendChild(
          item
        );

      }
    );

}


// ======================================================
// SHOW PENDING SYNC COUNT
// ======================================================

async function showPendingSyncSummary() {

  const box =
    document.getElementById(
      "pendingSyncSummary"
    );

  if (!box) {
    return;
  }

  try {

    const pending =
      await getOfflineRecords(
        "pendingSync"
      );

    box.textContent =
      pending.length +
      " item(s) waiting to sync.";

  } catch (error) {

    box.textContent =
      "Unable to read sync queue.";

  }

}

// ======================================================
// OFFLINE GUARD LOGIN
// ======================================================

let currentOfflineGuard = null;

function guardLogout() {

  currentOfflineGuard =
    null;


  const guardAppContent =
    document.getElementById(
      "guardAppContent"
    );

  const guardLoginCard =
    document.getElementById(
      "guardLoginCard"
    );

  const pinBox =
    document.getElementById(
      "guardPin"
    );

  const statusBox =
    document.getElementById(
      "guardLoginStatus"
    );


  if (guardAppContent) {

    guardAppContent.style.display =
      "none";

  }


  if (guardLoginCard) {

    guardLoginCard.style.display =
      "block";

  }


  if (pinBox) {

    pinBox.value =
      "";

  }


  if (statusBox) {

    statusBox.textContent =
      "Enter your guard PIN.";

  }

  window.location.reload();

}


async function offlineGuardLogin() {

  const pinBox =
    document.getElementById(
      "guardPin"
    );

  const statusBox =
    document.getElementById(
      "guardLoginStatus"
    );


  const enteredPin =
    String(
      pinBox.value || ""
    ).trim();


  if (!enteredPin) {

    statusBox.textContent =
      "Enter your PIN.";

    return;

  }


  try {

    const guards =
      await getOfflineRecords(
        "guards"
      );


    const pinHash =
      await hashPINForOfflineLogin(
        enteredPin
      );


    const matchedGuard =
      guards.find(
        function (guard) {

          return (
            String(
              guard.pinHash || ""
            ) ===
            pinHash
          );

        }
      );


    if (!matchedGuard) {

      statusBox.textContent =
        "❌ Invalid PIN.";

      pinBox.value =
        "";

      return;

    }


    currentOfflineGuard =
      matchedGuard;

        const guardWelcome =
      document.getElementById(
        "guardWelcome"
      );


    if (guardWelcome) {

      guardWelcome.textContent =
        "Welcome back, " +
        matchedGuard.name;

    }

 const guardRoleDisplay =
      document.getElementById(
        "guardRoleDisplay"
      );


    if (guardRoleDisplay) {

      guardRoleDisplay.textContent =
        matchedGuard.role ||
        "Guard";

    }

    const guardAppContent =
      document.getElementById(
        "guardAppContent"
      );

    const guardLoginCard =
      document.getElementById(
        "guardLoginCard"
      );


    if (guardAppContent) {

      guardAppContent.style.display =
        "block";

    }


    if (guardLoginCard) {

      guardLoginCard.style.display =
        "none";

    }


    statusBox.textContent =
  "✅ Logged in: " +
  matchedGuard.name +
  " (" +
  matchedGuard.role +
  ")";

const loginButton =
  document.querySelector(
    "#guardLoginCard button"
  );

if (loginButton) {

  loginButton.textContent =
    "🔓 Logged In";

}


    pinBox.value =
      "";


  } catch (error) {

    statusBox.textContent =
      "❌ Login error: " +
      (
        error && error.message
          ? error.message
          : String(error)
      );

  }

}


// ======================================================
// HASH PIN FOR OFFLINE LOGIN
// ======================================================

async function hashPINForOfflineLogin(
  pin
) {

  const encoder =
    new TextEncoder();

  const data =
    encoder.encode(
      String(pin)
    );


  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );


  const hashArray =
    Array.from(
      new Uint8Array(
        hashBuffer
      )
    );


  return hashArray
    .map(
      function (byte) {

        return byte
          .toString(16)
          .padStart(
            2,
            "0"
          );

      }
    )
    .join("");

}