// ======================================================
// PEGASUS PATROL
// BUILD 008
// OFFLINE DATABASE
// ======================================================

const PEGASUS_DB_NAME =
  "PegasusPatrolDB";

const PEGASUS_DB_VERSION =
  2;


// ======================================================
// OPEN DATABASE
// ======================================================

function openPegasusDB() {

  return new Promise(
    function (resolve, reject) {

      const request =
        indexedDB.open(
          PEGASUS_DB_NAME,
          PEGASUS_DB_VERSION
        );


      request.onupgradeneeded =
        function (event) {

          const db =
            event.target.result;


          if (
            !db.objectStoreNames.contains(
              "settings"
            )
          ) {

            db.createObjectStore(
              "settings",
              {
                keyPath: "key"
              }
            );

          }


          if (
            !db.objectStoreNames.contains(
              "guards"
            )
          ) {

            db.createObjectStore(
              "guards",
              {
                keyPath: "guardID"
              }
            );

          }


          if (
            !db.objectStoreNames.contains(
              "sites"
            )
          ) {

            db.createObjectStore(
              "sites",
              {
                keyPath: "siteID"
              }
            );

          }


          if (
            !db.objectStoreNames.contains(
              "routes"
            )
          ) {

            db.createObjectStore(
              "routes",
              {
                keyPath: "routeID"
              }
            );

          }


          if (
            !db.objectStoreNames.contains(
              "checkpoints"
            )
          ) {

            db.createObjectStore(
              "checkpoints",
              {
                keyPath: "checkpointID"
              }
            );

          }

        };

if (
  !db.objectStoreNames.contains(
    "activePatrols"
  )
) {

  db.createObjectStore(
    "activePatrols",
    {
      keyPath: "patrolID"
    }
  );

}

        request.onsuccess =
        function (event) {

          resolve(
            event.target.result
          );

        };


      request.onerror =
        function () {

          reject(
            request.error
          );

        };

    }
  );

}


// ======================================================
// SAVE RECORD
// ======================================================

async function saveOfflineRecord(
  storeName,
  record
) {

  const db =
    await openPegasusDB();


  return new Promise(
    function (resolve, reject) {

      const transaction =
        db.transaction(
          storeName,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          storeName
        );

      const request =
        store.put(
          record
        );


      request.onsuccess =
        function () {

          resolve(true);

        };


      request.onerror =
        function () {

          reject(
            request.error
          );

        };

    }
  );

}


// ======================================================
// GET ALL RECORDS
// ======================================================

async function getOfflineRecords(
  storeName
) {

  const db =
    await openPegasusDB();


  return new Promise(
    function (resolve, reject) {

      const transaction =
        db.transaction(
          storeName,
          "readonly"
        );

      const store =
        transaction.objectStore(
          storeName
        );

      const request =
        store.getAll();


      request.onsuccess =
        function () {

          resolve(
            request.result || []
          );

        };


      request.onerror =
        function () {

          reject(
            request.error
          );

        };

    }
  );

}