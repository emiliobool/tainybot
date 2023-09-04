import log from 'electron-log';
import * as settings from "./settings";
import { customLog } from "./customLog";

const { Configuration, OpenAIApi } = require("openai");

let openai = null;

settings.emitter.on("settings-changed:openai_api_key", async (apiKey) => {
    setAPIKey(apiKey)
});

export function setAPIKey(key) {
    if(!key) throw new Error("Invalid OpenAI API key");
    console.log("setting openai api key", key)
    const configuration = new Configuration({
        apiKey: key,
    });
    openai = new OpenAIApi(configuration);
}

settings.emitter.on('settings-changed:openai_api_key', setAPIKey)

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function chatgpt(messages) {
    if (!openai) throw new Error("OpenAI API not initialized");

    const s = await settings.getSettings();

    const completionData = {
        model: s.model,
        messages: messages,
        temperature: s.openai_temperature,
        top_p: s.openai_top_p,
        presence_penalty: s.openai_presence_penalty,
        frequency_penalty: s.openai_frequency_penalty,
        // max_tokens: s.openai_max_tokens,
    };

    customLog('info', "GPT request: ", completionData);

    const maxRetries = 5;
    let retryCount = 0;
    let success = false;
    let completion;

    while (!success && retryCount < maxRetries) {
        try {
            completion = await openai.createChatCompletion(completionData);
            success = true;
        } catch (error) {
            if (retryCount < maxRetries - 1) {
                const backoffTime = 2 ** retryCount * 1000; // Exponential backoff time in milliseconds
                // log.warn(`Request failed, retrying in ${backoffTime} ms. Error: ${error.message}`);
                customLog('warn', `Request failed, retrying in ${backoffTime} ms. Error: ${error.message}`);
                await sleep(backoffTime);
            } else {
                // log.error(`Request failed after ${maxRetries} attempts. Error: ${error.message}`);
                customLog('error', `Request failed after ${maxRetries} attempts. Error: ${error.message}`);
                throw error;
            }
        }
        retryCount++;
    }
    customLog('info', "GPT response: ", completion.data);

    return {
        text: completion.data.choices[0].message.content,
        tokens: completion.data.usage.total_tokens,
    };
}

/*{
 'id': 'chatcmpl-6p9XYPYSTTRi0xEviKjjilqrWU2Ve',
 'object': 'chat.completion',
 'created': 1677649420,
 'model': 'gpt-3.5-turbo',
 'usage': {'prompt_tokens': 56, 'completion_tokens': 31, 'total_tokens': 87},
 'choices': [
   {
    'message': {
      'role': 'assistant',
      'content': 'The 2020 World Series was played in Arlington, Texas at the Globe Life Field, which was the new home stadium for the Texas Rangers.'},
    'finish_reason': 'stop',
    'index': 0
   }
  ]
}*/