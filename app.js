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

              if (
                !syncRecord ||
                !syncRecord.patrol
              ) {

                 continue;

              }

if (!syncRecord) {

  continue;

}


// ====================================================
// INCIDENT SYNC
// ====================================================

if (syncRecord.incident) {

  try {

    await syncPendingIncident(
      syncRecord
    );

    await deleteOfflineRecord(
      "pendingSync",
      syncRecord.syncID
    );

  } catch (error) {

    console.log(
      "Incident sync pending:",
      error
    );

  }

  continue;

}


// ====================================================
// PATROL SYNC
// ====================================================

if (!syncRecord.patrol) {

  continue;

}


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

if (
  !syncRecord ||
  !syncRecord.patrol
) {

  continue;

}


     if (!syncRecord) {

  continue;

}


// ====================================================
// INCIDENT SYNC
// ====================================================

if (syncRecord.incident) {

  try {

    await syncPendingIncident(
      syncRecord
    );

    await deleteOfflineRecord(
      "pendingSync",
      syncRecord.syncID
    );

  } catch (error) {

    console.log(
      "Incident sync pending:",
      error
    );

  }

  continue;

}


// ====================================================
// PATROL SYNC
// ====================================================

if (!syncRecord.patrol) {

  continue;

}

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

if (!syncRecord) {

  continue;

}


// ====================================================
// INCIDENT SYNC
// ====================================================

if (syncRecord.incident) {

  await syncPendingIncident(
    syncRecord
  );

  await deleteOfflineRecord(
    "pendingSync",
    syncRecord.syncID
  );

  continue;

}


// ====================================================
// PATROL SYNC
// ====================================================

if (!syncRecord.patrol) {

  continue;

}

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

const incidentSiteBox =
  document.getElementById(
    "offlineIncidentSite"
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

if (incidentSiteBox) {

  incidentSiteBox.innerHTML =
    '<option value="">Select Site</option>';

}

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

if (incidentSiteBox) {

  const incidentOption =
    document.createElement(
      "option"
    );

  incidentOption.value =
    site.siteID;

  incidentOption.textContent =
    site.name;

  incidentSiteBox.appendChild(
    incidentOption
  );

}

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

const siteName =
  siteBox.options[
    siteBox.selectedIndex
  ]
    ? siteBox.options[
        siteBox.selectedIndex
      ].textContent.trim()
    : "";

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

siteName:
  siteName,

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

// Try to turn the camera torch on automatically
try {

  const videoTrack =
    checkpointCameraStream
      .getVideoTracks()[0];

  const capabilities =
    videoTrack.getCapabilities
      ? videoTrack.getCapabilities()
      : {};

  if (capabilities.torch) {

    await videoTrack.applyConstraints({
      advanced: [
        {
          torch: true
        }
      ]
    });

  }

} catch (torchError) {

  console.log(
    "Torch not available:",
    torchError
  );

}


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
// OFFLINE INCIDENT FORM
// ======================================================

function showOfflineIncidentForm() {

  const form =
    document.getElementById(
      "offlineIncidentForm"
    );

  if (form) {

    form.style.display =
      "block";

  }

}


function hideOfflineIncidentForm() {

  const form =
    document.getElementById(
      "offlineIncidentForm"
    );

  const statusBox =
    document.getElementById(
      "offlineIncidentStatus"
    );

  if (form) {

    form.style.display =
      "none";

  }

  if (statusBox) {

    statusBox.textContent =
      "";

  }

}

function readIncidentPhoto(file) {

  return new Promise(
    function (resolve, reject) {

      const reader =
        new FileReader();


      reader.onload =
        function () {

          const result =
            String(
              reader.result || ""
            );

          const commaPosition =
            result.indexOf(",");


          if (commaPosition === -1) {

            reject(
              new Error(
                "Unable to read incident photo."
              )
            );

            return;

          }


          resolve({
            data:
              result.substring(
                commaPosition + 1
              ),

            mimeType:
              file.type ||
              "image/jpeg"
          });

        };


      reader.onerror =
        function () {

          reject(
            new Error(
              "Unable to read incident photo."
            )
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}

async function submitOfflineIncident() {

  if (!currentOfflineGuard) {

    alert(
      "Please log in before reporting an incident."
    );

    return;

  }

  const typeBox =
    document.getElementById(
      "offlineIncidentType"
    );

 const siteBox =
  document.getElementById(
    "offlineIncidentSite"
  );

const routeBox =
  document.getElementById(
    "offlineRoute"
  );

  const priorityBox =
    document.getElementById(
      "offlineIncidentPriority"
    );

  const descriptionBox =
    document.getElementById(
      "offlineIncidentDescription"
    );

  const photoBox =
    document.getElementById(
      "offlineIncidentPhoto"
    );

  const statusBox =
    document.getElementById(
      "offlineIncidentStatus"
    );


  const incidentType =
    String(
      typeBox.value || ""
    ).trim();

  const priority =
    String(
      priorityBox.value || "Low"
    ).trim();

  const description =
    String(
      descriptionBox.value || ""
    ).trim();


  if (!incidentType) {

    statusBox.textContent =
      "❌ Select an incident type.";

    return;

  }


  if (!description) {

    statusBox.textContent =
      "❌ Enter an incident description.";

    return;

  }


  const incidentID =
    "INC-" +
    Date.now();

const selectedSiteID =
  currentOfflinePatrol
    ? currentOfflinePatrol.siteID
    : (
        siteBox
          ? siteBox.value
          : ""
      );

const selectedSiteName =
  currentOfflinePatrol
    ? currentOfflinePatrol.siteName || ""
    : (
        siteBox &&
        siteBox.selectedIndex >= 0
          ? siteBox.options[
              siteBox.selectedIndex
            ].textContent.trim()
          : ""
      );

if (!selectedSiteID) {

  statusBox.textContent =
    "❌ Select a site.";

  return;

}

const selectedRouteID =
  currentOfflinePatrol
    ? currentOfflinePatrol.routeID
    : (
        routeBox
          ? routeBox.value
          : ""
      );


let photoData =
  "";

let photoMimeType =
  "";


if (
  photoBox &&
  photoBox.files &&
  photoBox.files.length
) {

const photoFile =
  photoBox.files[0];


if (
  photoFile.size >
  4 * 1024 * 1024
) {

  statusBox.textContent =
    "❌ Photo is too large. Use a photo under 4 MB.";

  return;

}

const photoResult =
await readIncidentPhoto(
  photoFile
);

  photoData =
    photoResult.data;

  photoMimeType =
    photoResult.mimeType;

}

  const incident = {

    incidentID:
      incidentID,

    patrolID:
      currentOfflinePatrol
        ? currentOfflinePatrol.patrolID
        : "",

    guardID:
      currentOfflineGuard.guardID,

    guardName:
      currentOfflineGuard.name,

siteID:
  selectedSiteID,

siteName:
  selectedSiteName,

routeID:
  selectedRouteID,


    type:
      incidentType,

    priority:
      priority,

    description:
      description,

    photoData:
      photoData,

    photoMimeType:
      photoMimeType,

    createdAt:
      new Date().toISOString(),

    syncStatus:
      "Pending"

  };


  await saveOfflineRecord(
    "incidents",
    incident
  );


  const syncRecord = {

    syncID:
      "INCIDENT-" +
      incidentID,

    type:
      "Incident",

    incident:
      incident,

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

    statusBox.textContent =
      "🔄 Syncing incident...";

    await syncPendingIncident(
      syncRecord
    );

    await deleteOfflineRecord(
      "pendingSync",
      syncRecord.syncID
    );

    incident.syncStatus =
      "Synced";

    await saveOfflineRecord(
      "incidents",
      incident
    );

    await showPendingSyncSummary();

    statusBox.textContent =
      "✅ Incident reported successfully.";

  } catch (error) {

    statusBox.textContent =
      "✅ Incident saved — waiting to sync.";

  }

}

  typeBox.value =
    "";

  priorityBox.value =
    "Low";

  descriptionBox.value =
    "";

  if (photoBox) {

    photoBox.value =
      "";

  }

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