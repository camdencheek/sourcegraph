import { isEqual } from 'lodash'
import React, { useMemo, useState } from 'react'
import { from } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'

import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'

import { wrapRemoteObservable } from '../../api/client/api/common'
import { getActiveLoggersFromSettings } from '../../api/extension/api/loggers'
import { asError, isErrorLike } from '../../util/errors'
import { useObservable } from '../../util/useObservable'

import { ExtensionsDevToolsProps } from '.'

export const LoggersPanel: React.FunctionComponent<ExtensionsDevToolsProps> = props => {
    const registeredLoggersOrError = useObservable(
        useMemo(
            () =>
                from(props.extensionsController.extHostAPI).pipe(
                    switchMap(extensionHostAPI => wrapRemoteObservable(extensionHostAPI.getRegisteredLoggers())),
                    catchError(error => [asError(error)])
                ),
            [props.extensionsController]
        )
    )

    const activeLoggers = useObservable(
        useMemo(
            () =>
                from(props.platformContext.settings).pipe(
                    map(settings => {
                        if (settings.final && !isErrorLike(settings.final)) {
                            return getActiveLoggersFromSettings(settings.final)
                        }

                        return null
                    }),
                    tap(activeLoggers => activeLoggers && setNewActiveLoggers(activeLoggers))
                ),
            [props.platformContext]
        )
    )

    // Loading settings save

    const [newActiveLoggers, setNewActiveLoggers] = useState<Set<string>>(new Set())

    const onChangeActiveLogger: React.ChangeEventHandler<HTMLInputElement> = event => {
        if (event.target.checked) {
            setNewActiveLoggers(new Set([...newActiveLoggers, event.target.value]))
        } else {
            setNewActiveLoggers(new Set([...newActiveLoggers].filter(loggerName => loggerName !== event.target.value)))
        }
    }

    // Enable all
    const activateAllLoggers = (): void => {
        // Iterate over all registered loggers and add them to `newActiveLoggers`
        if (registeredLoggersOrError && !isErrorLike(registeredLoggersOrError)) {
            setNewActiveLoggers(new Set(registeredLoggersOrError.map(({ name }) => name)))
        }
    }
    // TODO: disable all disabled (when empty active size is same as registered size)

    // Disable all
    const deactivateAllLoggers = (): void => setNewActiveLoggers(new Set())
    // TODO: disable all disabled (when empty set)

    // Compute "Dirty"
    const activeLoggersChanged = useMemo(() => !isEqual(activeLoggers, newActiveLoggers), [
        activeLoggers,
        newActiveLoggers,
    ])

    const resetActiveLoggers = (): void =>
        activeLoggers ? setNewActiveLoggers(new Set([...activeLoggers])) : setNewActiveLoggers(new Set())

    return (
        <div>
            {registeredLoggersOrError ? (
                isErrorLike(registeredLoggersOrError) ? (
                    <div className="alert alert-danger mb-0 rounded-0">{registeredLoggersOrError.message}</div>
                ) : registeredLoggersOrError.length > 0 ? (
                    <>
                        <div className="list-group list-group-flush">
                            {registeredLoggersOrError.map(({ name }) => (
                                <div key={name} className="list-group-item py-2 d-flex align-items-center">
                                    <input
                                        type="checkbox"
                                        checked={newActiveLoggers.has(name)}
                                        value={name}
                                        onChange={onChangeActiveLogger}
                                        className="btn mx-2"
                                    />
                                    <span>{name}</span>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="btn btn-sm btn-primary" disabled={!activeLoggersChanged}>
                            Save
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            disabled={!activeLoggersChanged}
                            onClick={resetActiveLoggers}
                        >
                            Reset
                        </button>
                        <button type="button" className="btn btn-sm btn-secondary" onClick={activateAllLoggers}>
                            Activate all
                        </button>
                        <button type="button" className="btn btn-sm btn-secondary" onClick={deactivateAllLoggers}>
                            Deactivate all
                        </button>
                    </>
                ) : (
                    <span className="card-body">No registered loggers.</span>
                )
            ) : (
                <span className="card-body">
                    <LoadingSpinner className="icon-inline" /> Loading loggers...
                </span>
            )}
        </div>
    )
}
