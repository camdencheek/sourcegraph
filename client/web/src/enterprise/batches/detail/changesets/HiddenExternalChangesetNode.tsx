import React from 'react'

import { HiddenExternalChangesetFields } from '../../../../graphql-operations'

import { ChangesetStatusCell } from './ChangesetStatusCell'
import { HiddenExternalChangesetInfoCell } from './HiddenExternalChangesetInfoCell'

export interface HiddenExternalChangesetNodeProps {
    node: Pick<HiddenExternalChangesetFields, 'id' | 'nextSyncAt' | 'updatedAt' | 'state' | '__typename'>
}

export const HiddenExternalChangesetNode: React.FunctionComponent<HiddenExternalChangesetNodeProps> = ({ node }) => (
    <>
        <span className="d-none d-sm-block" />
        <div className="p-2">
            <input
                id={`select-changeset-${node.id}`}
                type="checkbox"
                className="btn"
                checked={false}
                disabled={true}
                data-tooltip="You do not have permission to detach this changeset"
            />
        </div>
        <ChangesetStatusCell
            id={node.id}
            state={node.state}
            className="p-2 hidden-external-changeset-node__status text-muted d-block d-sm-flex"
        />
        <HiddenExternalChangesetInfoCell node={node} className="p-2 hidden-external-changeset-node__information" />
        <span className="d-none d-sm-block" />
        <span className="d-none d-sm-block" />
        <span className="d-none d-sm-block" />
    </>
)
