// ======================================================
// PEGASUS PATROL
// BUILD 008
// OFFLINE DATA SYNC
// ======================================================

const PEGASUS_API_URL =
  "https://script.google.com/macros/s/AKfycbweAes8O4ZpxjdflMWgI2PFp-mj49jq_M8GFrRV0PaeLQn7yVJ7dLOkh3Ml5AcyvbYBEQ/exec";


// ======================================================
// SYNC PATROL DATA
// ======================================================

function syncPatrolData() {

  return new Promise(
    function (resolve, reject) {

      if (!navigator.onLine) {

        reject(
          new Error(
            "No internet connection."
          )
        );

        return;

      }


      const callbackName =
        "pegasusOfflineSync_" +
        Date.now();


      const script =
        document.createElement(
          "script"
        );


      window[
        callbackName
      ] =
        async function (result) {

          try {

            if (
              !result ||
              !result.success
            ) {

              throw new Error(
                "Pegasus data sync failed."
              );

            }

             // ===========================================
             // SAVE GUARDS
             // ===========================================

 for (
  const guard of
  (result.guards || [])
) {

  await saveOfflineRecord(
    "guards",
    guard
  );

}


            // ===========================================
            // SAVE SITES
            // ===========================================

            for (
              const site of
              (result.sites || [])
            ) {

              await saveOfflineRecord(
                "sites",
                site
              );

            }


            // ===========================================
            // SAVE ROUTES
            // ===========================================

            for (
              const route of
              (result.routes || [])
            ) {

              await saveOfflineRecord(
                "routes",
                route
              );

            }


            // ===========================================
            // SAVE CHECKPOINTS
            // ===========================================

            for (
              const checkpoint of
              (result.checkpoints || [])
            ) {

              await saveOfflineRecord(
                "checkpoints",
                checkpoint
              );

            }


            // ===========================================
            // SAVE LAST SYNC TIME
            // ===========================================

            await saveOfflineRecord(
              "settings",
              {
                key:
                  "lastPatrolDataSync",

                value:
                  result.syncedAt ||
                  new Date().toISOString()
              }
            );

resolve({
  success: true,

  guards:
    (result.guards || []).length,

  sites:
    (result.sites || []).length,

  routes:
    (result.routes || []).length,

  checkpoints:
    (result.checkpoints || []).length
});



          } catch (error) {

            reject(error);

          } finally {

            delete window[
              callbackName
            ];

            script.remove();

          }

        };


      script.onerror =
        function () {

          delete window[
            callbackName
          ];

          script.remove();

          reject(
            new Error(
              "Unable to contact Pegasus."
            )
          );

        };


      script.src =
        PEGASUS_API_URL +
        "?api=offline-patrol-data" +
        "&callback=" +
        encodeURIComponent(
          callbackName
        ) +
        "&t=" +
        Date.now();


      document.body.appendChild(
        script
      );

    }
  );

}

// ======================================================
// SYNC ONE PENDING PATROL
// ======================================================

async function syncPendingPatrol(
  syncRecord
) {

  if (
    !syncRecord ||
    !syncRecord.patrol
  ) {

    throw new Error(
      "Pending patrol data is missing."
    );

  }


  const response =
    await fetch(
      PEGASUS_API_URL +
      "?api=offline-patrol-sync",
      {
        method: "POST",

headers: {
  "Content-Type":
    "text/plain;charset=utf-8"
},

        body:
          JSON.stringify({
            patrol:
              syncRecord.patrol
          })
      }
    );


  const result =
    await response.json();


  if (
    !result ||
    !result.success
  ) {

    throw new Error(
      result &&
      result.message
        ? result.message
        : "Patrol sync failed."
    );

  }


  return result;

}

// ======================================================
// SYNC ONE PENDING INCIDENT
// ======================================================

async function syncPendingIncident(
  syncRecord
) {

  if (
    !syncRecord ||
    !syncRecord.incident
  ) {

    throw new Error(
      "Pending incident data is missing."
    );

  }


  const response =
    await fetch(
      PEGASUS_API_URL +
      "?api=offline-incident-sync",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify({
            incident:
              syncRecord.incident
          })
      }
    );


  const result =
    await response.json();


  if (
    !result ||
    !result.success
  ) {

    throw new Error(
      result &&
      result.message
        ? result.message
        : "Incident sync failed."
    );

  }


  return result;

}

// ======================================================
// CONFIRM OFFLINE PATROL EXISTS ON SERVER
// ======================================================

function confirmOfflinePatrolSync(
  patrolID
) {

  return new Promise(
    function (resolve, reject) {

      const callbackName =
        "pegasusPatrolConfirm_" +
        Date.now();


      const script =
        document.createElement(
          "script"
        );


      window[
        callbackName
      ] =
        function (result) {

          try {

            resolve(
              !!(
                result &&
                result.success &&
                result.found
              )
            );

          } finally {

            delete window[
              callbackName
            ];

            script.remove();

          }

        };


      script.onerror =
        function () {

          delete window[
            callbackName
          ];

          script.remove();

          reject(
            new Error(
              "Unable to confirm patrol sync."
            )
          );

        };


      script.src =
        PEGASUS_API_URL +
        "?api=offline-patrol-confirm" +
        "&patrolID=" +
        encodeURIComponent(
          patrolID
        ) +
        "&callback=" +
        encodeURIComponent(
          callbackName
        ) +
        "&t=" +
        Date.now();


      document.body.appendChild(
        script
      );

    }
  );

}