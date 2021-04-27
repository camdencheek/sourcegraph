import { BehaviorSubject } from 'rxjs'
import { map } from 'rxjs/operators'
import sourcegraph from 'sourcegraph'

import { Settings } from '../../../settings/settings'
import { ExtensionHostState } from '../extensionHostState'
import { addWithRollback } from '../util'

/** @internal */
export interface LoggerData {
    name: string

    /**
     * Whether logs have been hidden by the extension through `Logger#hideLogs`
     */
    hidden: boolean
}

/**
 * Creates a `Logger` for Sourcegraph extensions.
 *
 * @param state Extension host state
 * @param name Name of the logger
 * @param log This is only `console.log` for now, but could be replaced by any logging system.
 */
export function createLogger(state: ExtensionHostState, name: string, log = console.log): sourcegraph.Logger {
    // Store in extension host state to show registered loggers in the UI.
    const loggerData = new BehaviorSubject<LoggerData>({
        name,
        hidden: false,
    })

    const logger: sourcegraph.Logger = {
        log: (...data) => {
            // Log the message if the user has activated this logger
            // and the extension hasn't hidden it
            if (state.activeLoggers.has(name) && !loggerData.value.hidden) {
                // Use a light gray background to differentiate `name` from the message
                log(`%c${name}`, 'background-color: lightgrey;', ...data)
            }
        },
        showLogs: () => {
            if (loggerData.value.hidden) {
                loggerData.next({ ...loggerData.value, hidden: false })
            }
        },
        hideLogs: () => {
            if (!loggerData.value.hidden) {
                loggerData.next({ ...loggerData.value, hidden: true })
            }
        },
        unsubscribe: () => {
            subscription.unsubscribe()
        },
    }

    const subscription = addWithRollback(state.registeredLoggers, loggerData)

    return logger
}

/**
 * Sets active loggers extension host state based on user settings.
 *
 * @param state Extension host state
 */
export function setActiveLoggers(state: ExtensionHostState): sourcegraph.Unsubscribable {
    const activeLoggers = state.settings.pipe(map(settings => getActiveLoggersFromSettings(settings.final)))

    return activeLoggers.subscribe(activeLoggers => (state.activeLoggers = activeLoggers))
}

export function getActiveLoggersFromSettings(settings: Settings): Set<string> {
    if (!settings || !settings['extensions.activeLoggers']) {
        return new Set<string>()
    }

    const activeLoggers = settings['extensions.activeLoggers']

    if (!Array.isArray(activeLoggers)) {
        return new Set<string>()
    }

    return new Set<string>([...activeLoggers])
}
