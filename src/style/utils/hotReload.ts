import { monitorFile } from 'ags/file';
import { createDebouncer } from '../../lib/time/debounce';
import { SRC_DIR } from "src/lib/session/api";

export const initializeHotReload = async (applyCss: () => Promise<void>): Promise<void> => {
    const monitorList = [
        `${SRC_DIR}/style/main.scss`,
        `${SRC_DIR}/style/scss/bar.scss`,
        `${SRC_DIR}/style/scss/launcher.scss`,
        `${SRC_DIR}/style/scss/notification.scss`,
    ];

    const debounce = createDebouncer(150)
    let running = false
    let rerun = false

    const applyOnce = async () => {
        if (running) {
            rerun = true
            return
        }

        running = true
        try {
            await applyCss()
        } finally {
            running = false
            if (rerun) {
                rerun = false
                schedule()
            }
        }
    }

    const schedule = () => {
        debounce.schedule(() => {
            // make sure we don't create unhandled promises
            void applyOnce().catch(() => { })
        })
    }

    monitorList.forEach((file) => monitorFile(file, schedule))
};