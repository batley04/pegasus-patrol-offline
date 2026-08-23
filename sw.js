// ======================================================
// PEGASUS PATROL SERVICE WORKER
// BUILD 008
// ======================================================

const CACHE_NAME =
  "pegasus-patrol-build-008-v1";


const APP_FILES = [

  "./",
  "./index.html",
  "./app.js",
  "./db.js",
  "./sync.js",
  "./manifest.json"

];


// ======================================================
// INSTALL
// ======================================================

self.addEventListener(
  "install",
  function (event) {

    event.waitUntil(

      caches
        .open(
          CACHE_NAME
        )
        .then(
          function (cache) {

            return cache.addAll(
              APP_FILES
            );

          }
        )

    );

    self.skipWaiting();

  }
);


// ======================================================
// ACTIVATE
// ======================================================

self.addEventListener(
  "activate",
  function (event) {

    event.waitUntil(

      caches
        .keys()
        .then(
          function (keys) {

            return Promise.all(

              keys.map(
                function (key) {

                  if (
                    key !== CACHE_NAME
                  ) {

                    return caches.delete(
                      key
                    );

                  }

                }
              )

            );

          }
        )

    );

    self.clients.claim();

  }
);


// ======================================================
// FETCH
// ======================================================

self.addEventListener(
  "fetch",
  function (event) {

    if (
      event.request.method !==
      "GET"
    ) {
      return;
    }


    event.respondWith(

      fetch(
        event.request
      )
        .then(
          function (response) {

            return response;

          }
        )
        .catch(
          function () {

            return caches.match(
              event.request
            );

          }
        )

    );

  }
);