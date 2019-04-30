import uuid from 'uuid'
import pubsub from '../../pubsub'

import { log, print } from 'io.maana.shared'

require('dotenv').config()

const SELF = process.env.SERVICE_ID

const translateOne_Mock = ({ text, targetLanguageTag }) => ({
  id: `mock:${text}:${JSON.stringify(targetLanguageTag)}`,
  text,
  languageTag: targetLanguageTag
})

const translateMultiple_Mock = ({ texts, targetLanguageTag }) =>
  texts.map(text => translateOne_Mock({ text, targetLanguageTag }))

const translateOneLocalized_Mock = ({ localizedText, targetLanguageTag }) => ({
  id: `mock:${JSON.stringify(localizedText)}:${JSON.stringify(
    targetLanguageTag
  )}`,
  text: localizedText.text,
  languageTag: targetLanguageTag
})

const translateMultipleLocalized_Mock = ({
  localizedTexts,
  targetLanguageTag
}) =>
  localizedTexts.map(localizedTtext =>
    translateOneLocalized_Mock({ localizedTtext, targetLanguageTag })
  )

export const resolver = {
  Query: {
    translateOne_Mock: async (_, args) => translateOne_Mock(args),
    translateMultiple_Mock: async (_, args) => translateMultiple_Mock(args),
    translateOneLocalized_Mock: async (_, args) =>
      translateOneLocalized_Mock(args),
    translateMultipleLocalized_Mock: async (_, args) =>
      translateMultipleLocalized_Mock(args)
  }
}
