import AstalNetwork from "gi://AstalNetwork";
import GLib from "gi://GLib?version=2.0";
import { network } from "../index";

export function onNetworkConnection(
  setupFn: () => void,
  cleanupFn: () => void,
  checkIntervalMs = 10000
): () => void {
  const astalNetwork = AstalNetwork.get_default();
  let isOnline = false;
  let pollId: number | null = null;
  let lastCheckPromise: Promise<boolean> | null = null;

  const stopPolling = () => {
    if (pollId !== null) {
      GLib.Source.remove(pollId);
      pollId = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollId = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      checkIntervalMs,
      () => {
        checkAndApply();
        return GLib.SOURCE_CONTINUE; // keep polling
      }
    );
  };

  const checkAndApply = async () => {
    if (lastCheckPromise) return;

    const checkPromise = network.hasInternet();
    lastCheckPromise = checkPromise;

    const online = await checkPromise;

    if (lastCheckPromise !== checkPromise) return;
    lastCheckPromise = null;

    if (online && !isOnline) {
      isOnline = true;
      setupFn();
      // Keep polling to detect loss
      startPolling();
    } else if (!online && isOnline) {
      isOnline = false;
      cleanupFn();
      // Keep polling to detect restore
      startPolling();
    }
    // If state didn't change, do nothing
  };

  const onPrimaryChange = () => {
    if (astalNetwork.primary) {
      // Interface up → check immediately and start polling
      checkAndApply();
    } else {
      // Interface down → definitely offline
      if (isOnline) {
        isOnline = false;
        cleanupFn();
      }
      stopPolling();
    }
  };

  const handlerId = astalNetwork.connect("notify::primary", onPrimaryChange);

  // Initial state
  onPrimaryChange();

  return () => {
    astalNetwork.disconnect(handlerId);
    stopPolling();
    if (lastCheckPromise) lastCheckPromise = null;
  };
}
