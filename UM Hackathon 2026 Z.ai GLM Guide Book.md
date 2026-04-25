coding model ILMU-GLM-5.1 and VS Code, even if you've never written a single line of code in

your life. ​

### Part 0: Before You Begin - The Big Picture ​
## • A. Welcome! You're about to become an AI-enabled developer​ ◦ What you will achieve by the end of this guide: You will have a functional AI coding

assistant on your computer, ready to help you build all kinds of cool projects through a

professional code editor at any time.​
## ◦ Why this is easier than you think: no need for complex mathematical knowledge, nor a

computer science degree. We will use simple English instructions and a very user-friendly

large model.​
## • B. If you compare developing a cool system to cooking a dish​ ◦ ILMU-GLM-5.1 is created jointly by Z.ai and YTL AI Lab : It is your exclusive chef,

knowing thousands of recipes and mastering the art of cooking delicious ingredients with

the right heat.​
## ◦ VS Code: This is your clean, modern kitchen workspace where miracles happen. ​ ◦ Claude Code Plugin: This is a useful meal ordering device that allows you to accurately

tell the chef what dishes you want to cook, and also enables your chef to know what

equipment is available in the kitchen and what ingredients you have.​
## • C. Things You Need (Shopping List)​ ◦ Your personal computer​ ◦ Internet connection, and a browser that can download various things ​ ◦ That's it!​

### Step 1: Set up your code editing space on your computer ​
## • A. What is VS Code?​ ◦ Simply put, this is a free, concise, and efficient code editor where people can write code.

You can think of it as Microsoft Word or Excel, but it is specifically designed for code. ​
## • B. Step-by-Step Guide: Download and Install VS Code​ ◦ Step 1: Visit the official website of VS Code. https://code.visualstudio.com/​


## ◦ Step 2: Click the download button for your operating system (Windows, Mac, etc.). ​ ◦ Step 3: Install VS Code on the local environment and open it ​ ▪ It's as simple as installing any other application! ​


### Step 2: Prepare the necessary tools for you or your AI ​
## ▪ For us to initiate an AI code project, three key areas are required: ​

1. Sidebar (File Explorer):You can view files here.​


2. Main Editor: The large blank area where the code will be displayed.​


3. Expand Icon (Puzzle Piece):Button to add new plugins and features.​


## ▪ We only need to install Claude Code and Python in VSCode, and that's sufficient. ​ ▪ It is strongly recommended that you in advance according to the official

documentation of vscode, perform a test of installing python and running scripts,

because installations always vary across different systems:

[https://code.visualstudio.com/docs/python/python-tutorial​](https://code.visualstudio.com/docs/python/python-tutorial)
## ▪ Click the plugin button -> Enter "python" in the search bar at the top -> Click Install

and wait for completion -> Return to the search bar at the top and enter "Claude

CODE" -> Click Install and wait for completion;​
## ▪ You can see the Claude Code icon appears in the left sidebar. ​


## ▪ Note: If you haven't configured the corresponding settings, Claude Code may prompt

you to log in. When you see the login page, don't worry; once you configure it later, it

will automatically skip the login and enter this page. You can refer to:

https://www.how2shout.com/how-to/enable-disable-claude-code-dangerously-skip
permissions-vs-code.html​
## ▪ If you wish to configure it yourself, you can go to the Extensions - Settings in VSCode ->

Edit in settings.json, and then write the following in

claudeCode.environmentVariables: ​


代码块​


```
 1
 2
 3
 4

 5
 6
 7
 8
 9
10
11
12
13
14

```

```
"claudeCode.environmentVariables": [
{
  "name": "ANTHROPIC_BASE_URL",
  "value": "https://api.ilmu.ai/anthropic" //from maas
https://console.ilmu.ai/
},
{
  "name": "ANTHROPIC_AUTH_TOKEN",
  "value": "Your API Key" //from maas https://console.ilmu.ai/
},
{
  "name": "ANTHROPIC_MODEL",
  "value": "model-key" //from maas https://console.ilmu.ai/
}
],

```

## • Step 5: ​ ◦ Create a folder on the desktop​ ◦ Click the book-like icon in the resource management at the top left corner, click "open

folder", find the folder just created, and open it ​
## ◦ In VSCode, click the icon to create a file, and create a file with the suffix.py, such as

myapp.py ​
## ◦ Write a simple: print("hello world!")​ ◦ Click the Run button in the upper right corner to run this code script. Python

language is never that complicated. ​

### Step 3: Install our AI! Write the first AI code ​


and human mouse and keyboard operations into a format that AI can understand, so that AI

can issue commands to operate files, just like us humans.​


We need to tell Claude Code where the correct model is. ​


——Not all models have the ability to operate a code editor or write code. ILMU-GLM-5.1 is one of

the best choices.​
## • Step-by-Step: ​


You need to configure these parameters here. Just follow me to configure them. ​


We strongly recommend that everyone download cc-switch for easy visualization and

management of apikey and provider. ​


[https://github.com/farion1231/cc-switch/releases​](https://github.com/farion1231/cc-switch/releases)


Of course, you can also find more comprehensive parameter documentation and

[introductions here: https://docs.ilmu.ai/docs/getting-started/overview . ​](https://docs.ilmu.ai/docs/getting-started/overview)


After obtaining the apikey, open cc-switch, create a configuration for the ilmu provider, and

then enable the configuration. ​


[URL: https://api.ilmu.ai/anthropic​](https://api.ilmu.ai/anthropic)


Advanced Options choose API FormatAnthropic Messages, Auth Field choose

ANTHROPIC_AUTH_TOKEN (Default)​


### Step 4: Your First AI-Generated Project ​
## • A. Let's create a slightly more complex project, a chatbot​ ◦ If you don't have any ideas, you can also ask AI to help you think. ​ ◦ For example: "I am a beginner in AI, and I want to create a simple project that can be run

with a single script. Do you have any good suggestions?" ​
## ◦ I don't quite understand the Python environment or installed packages. Could you guide

and design it step by step for me to create a cool front-end page? Then tell me how to

open it. ​
## • B. The Art of Conversation: How to Optimize Your Requests​ ◦ Prompt is an art. You use it to communicate with AI.​ ◦ You can communicate with AI and tell it your thoughts. If you don't like the first result,

simply ask for a modification. ​
## ◦ Example prompts: "It's good, but can you make the style more tech-savvy?" or "Can you

add comments to explain each line of code?"​
## • C. Useful Resources​ ◦ https://chat.z.ai/ A useful AI chat bot, SOTA large model ​ ◦ https://chat.ilmu.ai/ ilmu chat​ ◦ https://console.ilmu.ai/ ilmu's MaaS platform ​ ◦ https://z.ai/model-api Zai's MaaS platform​ ◦ https://www.youtube.com/watch?v=m_TsMTRL_aI How to run Python on VSCode ​ ◦ https://claude.ai/Claude's website​

### Conclusion: You are now an AI coder!​
## • Quick Review: You have successfully subscribed to AI services, set up a professional coding

environment, connected them, and generated and run your first software.​
## • You've just opened the door to a brand new creative world. Don't be afraid to try, don't be

afraid to make seemingly silly requests, and boldly build something amazing. AI is your

partner. Happy coding!​


