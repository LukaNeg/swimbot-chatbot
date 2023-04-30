const express = require("express");
require("dotenv").config(); // configure dotenv

// import modules from OpenAI library
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(express.json());
app.listen(3000, () => console.log('listening at 3000'));
app.use(express.static('public'));
// const port = process.env.PORT || 5000;


// POST request endpoint
app.post("/ask", async (request, result) => {
  // getting prompt question from request
  const prompt = request.body.fullPrompt;
  //const prompt = "what is fire?";

  try {
    if (prompt == null) {
      throw new Error("Uh oh, no prompt was provided");
    }
    // trigger OpenAI completion
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    // retrieve the completion text from response
    const completion = response.data.choices[0].text;
    // console.log(completion);

    // return the result
    return result.status(200).json({
      success: true,
      message: completion,
    });

    } catch (error) {
      console.log(error.message);
    }
});
