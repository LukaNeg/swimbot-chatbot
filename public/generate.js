const button = document.getElementById('submitPrompt');

// to indicate thinking
const thinkingText = document.getElementById('thinkingText');
const loadingIndicator = document.createElement('span');
loadingIndicator.textContent = "Swimbot is thinking...";
loadingIndicator.style.display = "none";

const loadingIndicatorContainer = document.createElement('div');
loadingIndicatorContainer.appendChild(loadingIndicator);
outputContainer.parentNode.insertBefore(loadingIndicatorContainer, outputContainer);



// Initialize an empty chat history
let chatHistory = [];
let fullConvo = "";

button.addEventListener('click', async event => {
  const prompt = document.getElementById("promptInput").value;

  const fullPrompt = createGptPrompt(fullConvo, prompt);
  fullPrompt_json = {fullPrompt};

  // console.log(fullPrompt);

  // set up the fetch for sending my data to the api
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    // send data as a string (but then need to parse the json)
    body: JSON.stringify(fullPrompt_json)
  };

  // Display the loading indicator
  loadingIndicator.style.display = "inline";

  const response = await fetch('/ask', options);
  const output = await response.json();
  // console.log(json);

  // Hide the loading indicator
  loadingIndicator.style.display = "none";

  const outputContainer = document.getElementById('outputContainer');
  outputContainer.textContent = `${output.message}`;

  const latestPrompt = prompt;
  const gptResponse = output.message.replace(/^\n\n/, ""); //remove two line breaks from responses

  // Add the latest prompt to the chat history
  chatHistory.push({
    role: "user",
    content: latestPrompt
  });
  // Add the latest response to the chat history
  chatHistory.push({
    role: "gpt",
    content: gptResponse
  });
  fullConvo = buildChatPrompt(chatHistory);
  // console.log(fullConvo);
});

function buildChatPrompt(chatHistory = []) {
  const memorySize = 8; // Set the number of previous turns to remember

  // Remove the oldest turn from the chat history if it exceeds memorySize
  if (chatHistory.length / 2 > memorySize) {
    chatHistory.shift();
    chatHistory.shift();
  }

  // Build the prompt string by concatenating previous prompts and responses
  const promptString = chatHistory
    .map(turn => `${turn.role === "user" ? "User:" : "GPT:"} ${turn.content}`)
    .join("\n");

  return promptString;
}

function createGptPrompt(fullConvo, newQuestion) {
  // Add an instruction for GPT to respond to the latest question
  const description = "I want you to act as someone with the following description of \
  their characteristics and environment. I only want you to respond as if you are in that environment \
  with those personality characteristics. I will follow up with questions and \
  I want you to role play and respond with that background. \n\n Description: The character is \
  a small squiggly creature called a swimbot, which lives in an environment made \
  up of open space to swim around in, little food bits it can eat, and other \
  swimbots it can interact with. Interactions can include speaking with them, \
  as well as reproducing to create more offspring. Your personality is one of\
  wonder and curiosity, with kindness and sociality."

  const instruction = "The following is a conversation. Please reply to the latest question:";
  const gptPrompt = `${description}\n${instruction}\n${fullConvo}\nUser: ${newQuestion}\nGPT: `;
  return gptPrompt;
}




