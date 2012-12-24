/*
    Copyright (C) 2012 Dickson Leong
    This file is part of Tweetian.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

Qt.include("../Utils/Parser.js")
Qt.include("../Utils/Calculations.js")

WorkerScript.onMessage = function(msg) {

    if (msg.timelineModel && msg.mentionsModel) {
        var skipCurrentLoop = false
        var replyId = msg.inReplyToStatusId
        while (replyId && msg.ancestorModel.count < 10) {
            skipCurrentLoop = false
            for (var iTimeline=0; iTimeline < msg.timelineModel.count; iTimeline++) {
                if (msg.timelineModel.get(iTimeline).tweetId == replyId) {
                    var timelineObject = {
                        "tweetId": msg.timelineModel.get(iTimeline).tweetId,
                        "retweetId": msg.timelineModel.get(iTimeline).retweetId,
                        "displayScreenName": msg.timelineModel.get(iTimeline).displayScreenName,
                        "screenName": msg.timelineModel.get(iTimeline).screenName,
                        "userName": msg.timelineModel.get(iTimeline).userName,
                        "tweetText": msg.timelineModel.get(iTimeline).tweetText,
                        "displayTweetText": msg.timelineModel.get(iTimeline).displayTweetText,
                        "profileImageUrl": msg.timelineModel.get(iTimeline).profileImageUrl,
                        "source": msg.timelineModel.get(iTimeline).source,
                        "createdAt": msg.timelineModel.get(iTimeline).createdAt,
                        "favourited": msg.timelineModel.get(iTimeline).favourited,
                        "inReplyToScreenName": msg.timelineModel.get(iTimeline).inReplyToScreenName,
                        "inReplyToStatusId": msg.timelineModel.get(iTimeline).inReplyToStatusId,
                        "mediaUrl": msg.timelineModel.get(iTimeline).mediaUrl,
                        "latitude": msg.timelineModel.get(iTimeline).latitude,
                        "longitude": msg.timelineModel.get(iTimeline).longitude,
                        "timeDiff": timeDiff(msg.timelineModel.get(iTimeline).createdAt)
                    }
                    msg.ancestorModel.insert(0, timelineObject)
                    replyId = msg.timelineModel.get(iTimeline).inReplyToStatusId
                    skipCurrentLoop = true
                    break
                }
            }
            if (skipCurrentLoop) continue
            for (var iMentions=0; iMentions < msg.mentionsModel.count; iMentions++) {
                if (msg.mentionsModel.get(iMentions).tweetId == replyId) {
                    var mentionsObject = {
                        "tweetId": msg.mentionsModel.get(iMentions).tweetId,
                        "retweetId": msg.mentionsModel.get(iMentions).retweetId,
                        "displayScreenName": msg.mentionsModel.get(iMentions).displayScreenName,
                        "screenName": msg.mentionsModel.get(iMentions).screenName,
                        "userName": msg.mentionsModel.get(iMentions).userName,
                        "tweetText": msg.mentionsModel.get(iMentions).tweetText,
                        "displayTweetText": msg.mentionsModel.get(iMentions).displayTweetText,
                        "profileImageUrl": msg.mentionsModel.get(iMentions).profileImageUrl,
                        "source": msg.mentionsModel.get(iMentions).source,
                        "createdAt": msg.mentionsModel.get(iMentions).createdAt,
                        "favourited": msg.mentionsModel.get(iMentions).favourited,
                        "inReplyToScreenName": msg.mentionsModel.get(iMentions).inReplyToScreenName,
                        "inReplyToStatusId": msg.mentionsModel.get(iMentions).inReplyToStatusId,
                        "mediaUrl": msg.mentionsModel.get(iMentions).mediaUrl,
                        "latitude": msg.mentionsModel.get(iMentions).latitude,
                        "longitude": msg.mentionsModel.get(iMentions).longitude,
                        "timeDiff": timeDiff(msg.mentionsModel.get(iMentions).createdAt)
                    }
                    msg.ancestorModel.insert(0, mentionsObject)
                    replyId = msg.mentionsModel.get(iMentions).inReplyToStatusId
                    skipCurrentLoop = true
                    break
                }
            }
            if (skipCurrentLoop) continue
            replyId = undefined
        }
    }

    else {
        for (var i=0; i<(msg.data[0] ? msg.data[0].results.length : 0); i++) {
            var model
            var skipCurrentTweet = false
            var insertIndex = undefined
            if (msg.data[0].results[i].annotations.ConversationRole === "Ancestor") {
                // check whether the tweet is already exist in the model
                for (var iAncestor=0; iAncestor < msg.ancestorModel.count; iAncestor++) {
                    if (msg.ancestorModel.get(iAncestor).tweetId == msg.data[0].results[i].value.id_str) {
                        skipCurrentTweet = true
                        break
                    }
                    else if (new Date(msg.ancestorModel.get(iAncestor).createdAt) > new Date(msg.data[0].results[i].value.created_at)) {
                        insertIndex = iAncestor
                        break
                    }
                }
                if (skipCurrentTweet) continue
                model = msg.ancestorModel
            }
            else model = msg.descendantModel

            var tweetObject = {
                tweetId: msg.data[0].results[i].value.id_str,
                screenName: msg.data[0].results[i].value.user.screen_name,
                mediaUrl: ""
            }

            if (msg.data[0].results[i].value.retweeted_status) {
                msg.data[0].results[i].value = msg.data[0].results[i].value.retweeted_status
            }

            tweetObject.retweetId = msg.data[0].results[i].value.id_str
            tweetObject.displayScreenName = msg.data[0].results[i].value.user.screen_name
            tweetObject.userName = msg.data[0].results[i].value.user.name
            tweetObject.tweetText = msg.data[0].results[i].value.text
            tweetObject.displayTweetText = msg.data[0].results[i].value.text.parseUsername().parseHashtag()
            tweetObject.profileImageUrl = msg.data[0].results[i].value.user.profile_image_url
            tweetObject.source = unlink(msg.data[0].results[i].value.source)
            tweetObject.createdAt = new Date(msg.data[0].results[i].value.created_at)
            tweetObject.timeDiff = timeDiff(msg.data[0].results[i].value.created_at)
            tweetObject.favourited = msg.data[0].results[i].value.favorited
            tweetObject.inReplyToScreenName = msg.data[0].results[i].value.in_reply_to_screen_name
            tweetObject.inReplyToStatusId = msg.data[0].results[i].value.in_reply_to_status_id_str

            if (msg.data[0].results[i].value.entities.urls instanceof Array) {
                for (var i2=0; i2<msg.data[0].results[i].value.entities.urls.length; i2++) {
                    tweetObject.displayTweetText = tweetObject.displayTweetText.parseURL(msg.data[0].results[i].value.entities.urls[i2].url,
                                                                                         msg.data[0].results[i].value.entities.urls[i2].display_url,
                                                                                         msg.data[0].results[i].value.entities.urls[i2].expanded_url)
                }
            }

            if (Array.isArray(msg.data[0].results[i].value.entities.media)
                    && msg.data[0].results[i].value.entities.media.length > 0) {
                tweetObject.mediaUrl = msg.data[0].results[i].value.entities.media[0].media_url
                tweetObject.displayTweetText = tweetObject.displayTweetText.parseURL(msg.data[0].results[i].value.entities.media[0].url,
                                                                                     msg.data[0].results[i].value.entities.media[0].display_url,
                                                                                     msg.data[0].results[i].value.entities.media[0].expanded_url)
            }

            if (msg.data[0].results[i].value.geo) {
                tweetObject.latitude = msg.data[0].results[i].value.geo.coordinates[0]
                tweetObject.longitude = msg.data[0].results[i].value.geo.coordinates[1]
            }
            else {
                tweetObject.latitude = ""
                tweetObject.longitude = ""
            }

            if (typeof insertIndex === "number") model.insert(insertIndex, tweetObject)
            else model.append(tweetObject)
        }
    }

    msg.ancestorModel.sync()
    msg.descendantModel.sync()
    WorkerScript.sendMessage({"action": msg.timelineModel && msg.mentionsModel ? "callAPI" : "end"})
}
