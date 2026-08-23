// ======================================================
// PEGASUS PATROL
// BUILD 008
// OFFLINE FOUNDATION
// ======================================================


window.addEventListener(
  "load",
  function () {

    updateConnectionStatus();

    window.addEventListener(
      "online",
      function () {

        updateConnectionStatus();

        console.log(
          "Pegasus connection restored."
        );

      }
    );


    window.addEventListener(
      "offline",
      function () {

        updateConnectionStatus();

        console.log(
          "Pegasus is offline."
        );

      }
    );


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