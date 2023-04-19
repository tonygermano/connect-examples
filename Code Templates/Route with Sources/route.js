/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * 
 * Copyright Tony Germano 2023
 */

/**
 * The purpose of this code is to demonstrate how to route messages between channels
 * in a well-documented manner. It contains three functions: routeMessageByChannelId,
 * routeMessage, and createRawMessage. These functions work together to route messages
 * between channels, given a channelId or a channelName.
 *
 * For a better understanding of the code, let's go through the functions:
 */

/**
 * Route a message to the specified channelId.
 * 
 * @function
 * @param {string|number} channelId - The unique identifier of the channel to route the message to.
 * @param {string} message - The content of the message to be sent.
 * @param {Object} sourceMap - A map containing the source channel and message IDs.
 * @param {Set} destinationSet - A set of destination channels (optional).
 * @returns {Response} - The Response object returned by the channel, if its source connector is configured to return one. 
 */
function routeMessageByChannelId(channelId, message, sourceMap, destinationSet) {
    return router.routeMessageByChannelId(channelId, createRawMessage(message, sourceMap, destinationSet))
}

/**
 * Route a message to the specified channelName.
 * 
 * @function
 * @param {string} channelName - The name of the channel to route the message to.
 * @param {string} message - The content of the message to be sent.
 * @param {Object} sourceMap - A map containing the source channel and message IDs.
 * @param {Set} destinationSet - A set of destination channels (optional).
 * @returns {Response} - The Response object returned by the channel, if its source connector is configured to return one.
 */
function routeMessage(channelName, message, sourceMap, destinationSet) {
    return router.routeMessage(channelName, createRawMessage(message, sourceMap, destinationSet))
}

/**
 * Create a raw message with the specified content, source, and destination information.
 * 
 * @function
 * @private
 * @param {string} message - The content of the message.
 * @param {Object} sourceMap - A map containing the source channel and message IDs.
 * @param {Set} destinationSet - A set of destination channels (optional).
 * @returns {RawMessage} - A RawMessage object containing the message, source, and destination information.
 */
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
