const button = document.getElementById('submitPrompt');
const persButton = document.getElementById('initPersonality');


// to indicate thinking
const thinkingText = document.getElementById('thinkingText');
const loadingIndicator = document.createElement('span');
loadingIndicator.textContent = "Swimbot is thinking...";
loadingIndicator.style.display = "none";

const loadingIndicatorContainer = document.createElement('div');
loadingIndicatorContainer.appendChild(loadingIndicator);
outputContainer.parentNode.insertBefore(loadingIndicatorContainer, outputContainer);


const Sliders = document.querySelectorAll('.slider');
const slideValues = document.querySelectorAll('.slider-value');

// Set initial values of sliders and display values
const initialValues = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
for (let i = 0; i < Sliders.length; i++) {
  Sliders[i].value = initialValues[i];
  slideValues[i].textContent = getSliderValueLabel(initialValues[i]);
}

// Add event listeners to sliders to update displayed values
Sliders.forEach(slider => {
  slider.addEventListener('input', event => {
    const sliderValue = event.target.value;
    const sliderIndex = Array.from(Sliders).indexOf(slider);
    slideValues[sliderIndex].textContent = getSliderValueLabel(sliderValue);
  });
});

// Helper function to get label for slider value
function getSliderValueLabel(value) {
  const labels = ['low', 'medium', 'high'];
  return labels[value];
}

// Initialize an empty chat history
let chatHistory = [];
let fullConvo = "";

button.addEventListener('click', async event => {
  const prompt = document.getElementById("promptInput").value;

  const allSliderScores = [];
    Sliders.forEach(slider => {
      allSliderScores.push(parseInt(slider.value));
  });

  const personalityPrompt = describePersonality(allSliderScores.slice(0, 5));
  const environmentPrompt = describeEnvironment(allSliderScores.slice(5, 10));
  // const personalityPrompt = describePersonality([2,2,0,0,0]) //kindness, curiosity, optimism, sociality, competitivness

  const fullPrompt = createGptPrompt(fullConvo, prompt, personalityPrompt, environmentPrompt);
  fullPrompt_json = {fullPrompt};

  // console.log(fullPrompt);
  // console.log(allSliderScores.slice(5, 10));

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
  const memorySize = 6; // Set the number of previous turns to remember

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

// function to describe the swimbots personality
function describePersonality(personalityScores) {
  const personality = {
    0: "not very",
    1: "a little",
    2: "very"
  };

  const [kindness_score, curiosity_score, optimism_score, sociality_score, competitivness_score] = personalityScores;

  const kindness = personality[kindness_score];
  const curiosity = personality[curiosity_score];
  const optimism = personality[optimism_score];
  const sociality = personality[sociality_score];
  const competitivness = personality[competitivness_score];

  const prompt = `This swimbot has a personality in which they are ${kindness} kind, ${curiosity} curious, ${optimism} optimistic, ${sociality} social, and ${competitivness} competitive. These personality traits play out how they respond to questions, their actions, and overall attitude on life.`;

  return prompt;
}

// // function to describe the swimbots current physical state or environment
// function describeEnvironment(environmentScores) {
//   const state = {
//     0: "not at all",
//     1: "sort of",
//     2: "very"
//   };

//   // improve this so that only the extreme conditions show up in the description. to reduce what
//   // the swimbot has to think about

//   const [hunger_score, heat_score, offspring_score, mobility_score, fooddist_score] = environmentScores;

//   const hunger = state[hunger_score];
//   const heat = state[heat_score];
//   const offspring = state[offspring_score];
//   const mobility = state[mobility_score];
//   const fooddist = state[fooddist_score];

//   const prompt = `This swimbot is currently ${hunger} hungry, ${heat} horny or looking for mates, has ${offspring} many offspring, can swim ${mobility} quickly and easily, and is ${fooddist} far from food. These conditions affect what the swimbot is thinking most about right now.`;

//   return prompt;
// }


function describeEnvironment(environmentScores) {
  const [hunger_score, mating_score, offspring_score, mobility_score, fooddist_score] = environmentScores;

  let prompt = "What the swimbot is thinking about most right now: ";

  if (hunger_score === 2) {
    prompt += "This swimbot is currently thinking about how hungry it is";
    if (fooddist_score === 2) {
      prompt += " and it's really far from food";
    }
    if (offspring_score === 0) {
      prompt += ". It also doesn't have any offspring yet";
    }
  } else if (mating_score === 2) {
    prompt += "This swimbot is currently thinking about how much it is desiring to mate";
    if (offspring_score === 0) {
      prompt += ", and that is made even worse by the fact that it has no offspring yet";
    }
    if (fooddist_score === 2) {
      prompt += ". It also quite far from food, so it's starting to think about being hungry";
    }
  } else {
    prompt += "Just exploring";
    return prompt;
  }

  if (mobility_score === 0) {
    prompt += ". Its poor mobility is making it difficult to get to what it needs";
  }
  prompt += ".";
  return prompt;
}





function createGptPrompt(fullConvo, newQuestion, personality="", environment="") {
  // Add an instruction for GPT to respond to the latest question
  const description = "I want you to act as someone with the following description of\
  their characteristics and environment. I only want you to respond as if you are in that environment \
  with those personality characteristics. I will follow up with questions and\
  I want you to role play and respond with that background. \n\nDescription: The character is\
  a small squiggly creature called a swimbot, which lives in an environment made\
  up of open space to swim around in, little food bits it can eat, and other\
  swimbots it can interact with. Interactions can include speaking with them,\
  as well as reproducing to create more offspring."
  // Your personality is one of wonder and curiosity, with kindness and sociality."

  const instruction = "The following is a conversation. Please reply to the latest question:";

  const gptPrompt = `${description}\n\nPersonality: ${personality}\n\nEnvironment and Physical state: ${environment}\n\n${instruction}\n\n${fullConvo}\nUser: ${newQuestion}\nGPT: `;
  return gptPrompt;
}




