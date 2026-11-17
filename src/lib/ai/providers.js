import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const factories = {
  google: (model, apiKey, { temperature }) =>
    new ChatGoogleGenerativeAI({ model, apiKey, temperature, maxRetries: 0 }),
};

export function isSupportedProvider(provider) {
  return Object.prototype.hasOwnProperty.call(factories, provider);
}

export function createModel(provider, model, apiKey, opts) {
  const factory = factories[provider];
  if (!factory) throw new Error(`Unsupported AI provider: ${provider}`);
  return factory(model, apiKey, opts);
}
