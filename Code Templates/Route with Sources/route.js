/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * 
 * Copyright Tony Germano 2023
 */

function routeMessageByChannelId(channelId, message, sourceMap, destinationSet) {
    return router.routeMessageByChannelId(channelId, createRawMessage(message, sourceMap, destinationSet))
}

function routeMessage(channelName, message, sourceMap, destinationSet) {
    return router.routeMessage(channelName, createRawMessage(message, sourceMap, destinationSet))
}

function createRawMessage(message, sourceMap, destinationSet) {
    if (typeof destinationSet === 'undefined') destinationSet = null
    if (sourceMap == null) sourceMap = java.util.Collections.emptyMap()

    const sourceChannelIds = $('sourceChannelIds') ? new java.util.ArrayList($('sourceChannelIds'))
        : $('sourceChannelId') ? new java.util.ArrayList([$('sourceChannelId')])
        : new java.util.ArrayList()
    const sourceMessageIds = $('sourceMessageIds') ? new java.util.ArrayList($('sourceMessageIds'))
        : $('sourceMessageId') ? new java.util.ArrayList([$('sourceMessageId')])
        : new java.util.ArrayList()

    const messageId = new java.lang.Long(connectorMessage.messageId)

    sourceChannelIds.add(channelId)
    sourceMessageIds.add(messageId)

    const newSourceMap = new java.util.HashMap(sourceMap)
    newSourceMap.putAll({
        sourceChannelIds: sourceChannelIds,
        sourceChannelId: channelId,
        sourceMessageIds: sourceMessageIds,
        sourceMessageId: messageId
    })

    return new RawMessage(message, destinationSet, newSourceMap)
}