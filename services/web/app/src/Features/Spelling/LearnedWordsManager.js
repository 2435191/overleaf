const { db } = require('../../infrastructure/mongodb')
const logger = require('@overleaf/logger')
const metrics = require('@overleaf/metrics')
const { promisify } = require('util')
const OError = require('@overleaf/o-error')

const LearnedWordsManager = {
  learnWord(userToken, word, callback) {
    return db.spellingPreferences.updateOne(
      {
        token: userToken,
      },
      {
        $addToSet: { learnedWords: word },
      },
      {
        upsert: true,
      },
      callback
    )
  },

  unlearnWord(userToken, word, callback) {
    return db.spellingPreferences.updateOne(
      {
        token: userToken,
      },
      {
        $pull: { learnedWords: word },
      },
      callback
    )
  },

  getLearnedWords(userToken, callback) {
    db.spellingPreferences.findOne(
      { token: userToken },
      function (error, preferences) {
        if (error != null) {
          return callback(OError.tag(error))
        }
        let words =
          (preferences != null ? preferences.learnedWords : undefined) || []
        if (words) {
          // remove duplicates
          words = words.filter(
            (value, index, self) => self.indexOf(value) === index
          )
        }
        callback(null, words)
      }
    )
  },

  deleteUsersLearnedWords(userToken, callback) {
    db.spellingPreferences.deleteOne({ token: userToken }, callback)
  },
}

const promises = {
  learnWord: promisify(LearnedWordsManager.learnWord),
  unlearnWord: promisify(LearnedWordsManager.unlearnWord),
  getLearnedWords: promisify(LearnedWordsManager.getLearnedWords),
  deleteUsersLearnedWords: promisify(
    LearnedWordsManager.deleteUsersLearnedWords
  ),
}

LearnedWordsManager.promises = promises

module.exports = LearnedWordsManager
;['learnWord', 'unlearnWord', 'getLearnedWords'].map(method =>
  metrics.timeAsyncMethod(
    LearnedWordsManager,
    method,
    'mongo.LearnedWordsManager',
    logger
  )
)
