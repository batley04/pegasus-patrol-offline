// ======================================================
// PEGASUS PATROL SERVICE WORKER
// BUILD 008
// ======================================================

const CACHE_NAME =
  "pegasus-patrol-build-008-v18";

const APP_FILES = [

  "./",
  "./index.html",
  "./app.js",
  "./db.js",
  "./sync.js",
  "./manifest.json",
  "./lib/jsQR.js",

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
// OFFLINE-FIRST APP SHELL
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


    // ==================================================
    // PAGE NAVIGATION
    // ==================================================

    if (
      event.request.mode ===
      "navigate"
    ) {

      event.respondWith(

        fetch(
          event.request
        )
          .then(
            function (response) {

              const copy =
                response.clone();


              caches
                .open(
                  CACHE_NAME
                )
                .then(
                  function (cache) {

                    cache.put(
                      "./index.html",
                      copy
                    );

                  }
                );


              return response;

            }
          )

          .catch(
            function () {

              return caches.match(
                "./index.html"
              );

            }
          )

      );

      return;

    }


    // ==================================================
    // APP FILES
    // ==================================================

    event.respondWith(

      caches.match(
        event.request
      )
        .then(
          function (cachedResponse) {

            if (
              cachedResponse
            ) {

              return cachedResponse;

            }


            return fetch(
              event.request
            )
              .then(
                function (response) {

                  const copy =
                    response.clone();


                  caches
                    .open(
                      CACHE_NAME
                    )
                    .then(
                      function (cache) {

                        cache.put(
                          event.request,
                          copy
                        );

                      }
                    );


                  return response;

                }
              );

          }
        )

    );

  }
);