// ======================================================
// PEGASUS PATROL
// BUILD 008
// OFFLINE DATABASE
// ======================================================

const PEGASUS_DB_NAME =
  "PegasusPatrolDB_B008";

const PEGASUS_DB_VERSION =
  5;


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


if (
  !db.objectStoreNames.contains(
    "pendingSync"
  )
) {

  db.createObjectStore(
    "pendingSync",
    {
      keyPath: "syncID"
    }
  );

}

if (
  !db.objectStoreNames.contains(
    "incidents"
  )
) {

  db.createObjectStore(
    "incidents",
    {
      keyPath: "incidentID"
    }
  );

}
           

        };



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

// ======================================================
// DELETE RECORD
// ======================================================

async function deleteOfflineRecord(
  storeName,
  key
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
        store.delete(
          key
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

async function getLatestActivePatrol(guardID) {

  const db = await openPegasusDB();

  return new Promise(function (resolve, reject) {

    let latest = null;
    let latestTime = -Infinity;
    let transaction;

    try {

      transaction = db.transaction(
        "activePatrols",
        "readonly"
      );

      transaction.oncomplete = function () {
        db.close();
        resolve(latest);
      };

      transaction.onabort = function () {
        db.close();
        reject(
          transaction.error ||
          new Error("Unable to read active patrol.")
        );
      };

      const request = transaction
        .objectStore("activePatrols")
        .openCursor();

      request.onsuccess = function () {

        const cursor = request.result;

        if (!cursor) {
          return;
        }

        const patrol = cursor.value;

        if (
          patrol &&
          patrol.status === "Active" &&
          (
            guardID == null ||
            String(patrol.guardID) === String(guardID)
          )
        ) {

          const parsedTime =
            new Date(patrol.startedAt || 0).getTime();

          const startedTime =
            Number.isFinite(parsedTime) ? parsedTime : 0;

          if (!latest || startedTime > latestTime) {
            latest = patrol;
            latestTime = startedTime;
          }

        }

        cursor.continue();

      };

    } catch (error) {

      db.close();
      reject(error);

    }

  });

}
