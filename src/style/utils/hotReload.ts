import { monitorFile } from 'ags/file';
import { timeout, Timer } from 'ags/time';
import { themeManager } from '..';

export const initializeHotReload = async (): Promise<void> => {
    const monitorList = [
        `${SRC_DIR}/style/main.scss`,
        `${SRC_DIR}/style/scss/bar.scss`,
        `${SRC_DIR}/style/scss/launcher.scss`,
        `${SRC_DIR}/style/scss/notification.scss`,
    ];

    let debounce: Timer | undefined
    let running = false
    let rerun = false

    const applyOnce = async () => {
        if (running) {
            rerun = true
            return
        }

        running = true
        try {
            await themeManager.applyCss()
        } finally {
            running = false
            if (rerun) {
                rerun = false
                schedule()
            }
        }
    }

    const schedule = () => {
        debounce?.cancel()
        debounce = timeout(150, () => {
            // make sure we don't create unhandled promises
            void applyOnce()
        })
    }

    monitorList.forEach((file) => monitorFile(file, schedule))
};
