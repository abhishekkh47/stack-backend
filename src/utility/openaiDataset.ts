"use strict";
export const SYSTEM_INPUT = {
  SYSTEM: `"“dataset1” below contains a list of business descriptions, the corresponding category of that business, the problem that business solves as well as an indication of how many potential customer that business may have.
  I want you to write a business description as well as an indication of how many potential customer that business may have  that closely follows the format of the business descriptions in “dataset1"".  These are all one sentence, short but unique businesses.
  You will write three different business descriptions and potential customers for the category and problem provided by user prompt.
  
  The format of the three business descriptions and potential customer should be an array as follows:
  [{"businessDescription": [insert business description],"opportunityHighlight": [insert potential customers datapoint]]
  
  dataset1: 
  A gamified and story-driven application teaching coding in Python, HTML, CSS, or JavaScript.        Online Gaming        Balancing gaming with other life responsibilities.        Over 6 million individuals learn the coding languages Python, HTML, CSS, or JavaScript each year.
  An AI shopping assistant integrated into e-commerce platforms to personalize customer shopping experiences.        Sizing        Difficulty finding consistent sizing across brands.        Approximately 1.8 billion people globally shop online.
  A LinkedIn post generator optimizing posts for audience engagement and personal branding.        Social Media        Managing personal reputation or brand.        Over 310 million monthly active users are on LinkedIn.
  A mobile app providing theft protection, insurance, roadside assistance, and on-demand repairs for e-bike owners.        Outdoor Adventure/Sports        Experiencing equipment or gear issues.        More than 5 million e-bikes were sold globally in 2023.
  A digital Bitcoin art marketplace leveraging smart contracts and the Lightning Network for digital art asset exchanges.        Cryptocurrency        Accessing and analyzing public blockchain data.        The digital art market has over 1 million active buyers.
  A virtual poker app designed for friend groups, featuring chat and video interfaces for a social gaming experience.        Online Gaming        Building a team in cooperative games.        An estimated 100 million people worldwide play poker.
  A text-to-audio app utilizing AI to customize human-like emotions in audio content.        Making Music        Learning music production software.        There are 400 million audiobook listeners globally.
  A travel credit card tailored to the unique needs of Generation Z.        Luxury Travel        Personalized itinerary planning.        67 million Generation Z individuals are in the U.S.
  A brokerage firm enabling users to build custom ETFs based on their investment preferences and risk profile.        Trading Stocks        Experiencing volatility due to inadequate risk management.        56% of Americans own stocks.
  A voice-to-action AI agent acting as a personal assistant, managing administrative tasks and life organization.        Financial Literacy        Managing credit and debt.        110 million users in the U.S. utilize virtual assistants.
  A fintech platform allowing Mexican nationals to earn US Dollars and pay in Mexican Pesos.        Financial Literacy        Understanding cryptocurrency and digital assets.        Over 1.5 million Mexican nationals currently live and work in the U.S.
  A marketplace streamlining the acquisition and transaction process of small businesses.        Trading Stocks        Losing money by following online communities/posts.        Annually, around 2.5 million small businesses are sold in the U.S.
  A marketplace for rare coins and precious metals, using auction data and historical pricing for accurate valuations.        Cryptocurrency        Volatility in web3 assets like NFTs.        There are over 5 million active collectors of coins and precious metals in the U.S.
  An AI-driven shopping platform where users can find clothing items based on inputted styles or looks.        Fast Fashion        Identifying sustainably made products.        390 million people globally prioritize sustainability as their number one driver for purchasing clothing.
  An AI-driven video game designer generating new maps, terrains, and resources for unpredictable gameplay.        Online Gaming        Lack of innovation in majority of games.        Popular video games like Fortnite and Call of Duty have over 400 million users.
  A platform identifying the best plane ticket deals using exclusively credit card points.        Budget Travel        Finding affordable eating options.        18.9 million credit card holders redeemed points for airplane miles in 2023.
  An AI-driven news content writer focusing on niche current events for cost-effective article creation.        Writing        Finding inspiration.        There are approximately 1.5 million digital news subscribers in the U.S..
  An app leveraging AI to create and share photos of users in imaginary situations on social media.        Social Media        Avoiding content or creation burnout.        159 million Americans use photo editing apps each year.
  An AI-driven math tutor incorporating speech, text, and image recognition for personalized learning.        Education        Finding effective learning strategies.        10.2 million students use math tutoring services each year.
  An AI-driven marketplace offering back-office tasks like lead generation or financial modeling at competitive prices.        Financial Literacy        Grasping financial regulation and legal practices.        Approx. 8 million small businesses use lead generation services each year.
  An AI and gamified nutrition coach allowing meal logging through photo recognition.        Health & Nutrition        Creating balanced and nutritious meals.        There are over 100 million health app users in the U.S..
  An AI-driven video animation creator transforming text inputs into short-form animations.        Videography        Time-consuming editing process.        Over 40 million creators worldwide use video editing software.
  A multiplayer development platform providing game servers, matchmaking, and DDoS mitigation.        Online Gaming        Ensuring fair play and dealing with cheaters.        The global eSports audience is 474 million people.
  An AI search engine for academic research, answering questions with included citations.        Education        Accessing diverse educational resources.        38 million college students have expressed a need for more diverse educational resources.
  A mobile application optimizing app usage time for mental health benefits.        Mental Health        Managing screen time effectively.        An estimated 200 million health app users are interested in apps for managing screen time.
  An AI-driven comic creator instantly generating comics from text inputs.        Drawing/Painting        Overcoming creative block.        15 million digital comics readers might seek tools or services to overcome creative block.
  A marketplace for real-life events, using AI to optimize and personalize event suggestions.        Festivals/Concerts        Locating concerts and festivals.        300 million active users on social event discovery platforms are likely to actively seek out concerts and festivals.
  A mobile app enforcing habits through monetary wagers.        Mental Health        Building positive habits and routines.        Approximately 380 million health app users specifically focus on building positive habits and routines.
  A social app for creators, educators, and experts to launch video courses and provide AI-assisted coaching.        Education        Accessing diverse educational resources.        50 million students and academic researchers may actively seek diverse educational resources online.
  A marketplace offering curated real-life guides and adventures globally for trip planning.        Adventure        Difficulty finding travel buddies for niche adventures.        70 million international tourists might be interested in finding travel companions for niche adventures.
  A text-to-video language model converting text inputs into visually rich short-form videos.        Videography        Generating engaging and original content ideas.        About 70 million students and professionals could be interested in tools for generating original content ideas.
  A self-custody bitcoin app catering to users wary of crypto exchanges and hardware wallets.        Cryptocurrency        Security breaches in accounts/wallets.        20 million cryptocurrency users may be particularly concerned with security and interested in self-custody solutions.
  A Fintech platform enabling investment in company earnings, revenues, regions, and segments without buying stocks.        Trading Stocks        Incurring losses from borrowing/margin trading.        14.5 million Americans who invest in the stock market might engage in higher-risk activities like borrowing or margin trading.
  A digital wealth management platform offering access to actively managed alternative investment portfolios.        Financial Literacy        Learning about stock trading and investing.        Over 19.6 million high-net-worth individuals represent a specific market for advanced stock trading and investment learning resources.
  An all-in-one fintech platform providing bank accounts, transfers, credit cards, and financial data for e-commerce businesses.        Financial Literacy        Optimizing financial infrastructure.        More than 3.6 million small to medium-sized e-commerce businesses could benefit from financial infrastructure optimization.
  A reseller marketplace for second-hand fashion using live streaming and video marketing.        Fast Fashion        Influencer-led promotions and follower mentality.        Approximately 24 million people influenced by social media promotions might be interested in a reseller fashion marketplace.
  An AI-driven picture-to-purchase e-commerce tool converting online images into purchase links.        Online Shopping        Finding quality products at affordable prices.        Around 214 million online shoppers are likely seeking AI-driven tools to find quality products at competitive prices.
  An accelerator program focused on Roblox games.        Online Gaming        Building a team in cooperative games.        Over 40.4 million active Roblox users are interested in cooperative gameplay and team building.
  An AI-driven dating matchmaker emphasizing depth by limiting engagement to one user at a time.        Online Dating        Overwhelmed by choices.        With 323 million people using dating apps, about 48.45 million might seek services that limit choices to enhance the dating experience.
  A virtual reality basketball game where players team up to defeat non-player characters.        Virtual Reality Games        Limited social interaction in VR gaming.        In the virtual reality gaming market of 171 million users, around 17.1 million might seek games offering more social interaction.
  A food manufacturer specializing in sustainable seafood alternatives using plant protein and biotechnology.        Conservation/Environmentalism        Habitat destruction and fragmentation.        The global plant-based food market includes an estimated 15 million consumers highly concerned with habitat destruction and fragmentation.
  A cat food manufacturer incorporating plant protein for more sustainable animal food.        Conservation/Environmentalism        Conflict with local communities or businesses.        Over 4.2 million U.S. households owning cats could be a market for sustainable pet food addressing conflicts with local communities or businesses.
  An AI-driven website builder converting text prompts into functional landing pages and websites.        Technology        Navigating website design and development.        Approximately 180 million small business owners might actively seek AI-driven website builders.
  A commission-free sports betting exchange for bets against peers rather than the house.        Fantasy/Betting        Keeping fantasy league participation within budget.        The global online sports betting market includes about 3 million users interested in a commission-free betting exchange for fantasy league management.
  A group rideshare app offering on-demand 15-passenger van bookings for consumers and businesses.        Transportation        Finding affordable and reliable travel options.        Among the 36 million users of ridesharing apps in the U.S., about 7.2 million might be looking for group rideshare services.
  An AI-driven fitness app providing personalized coaching for runners.        Fitness/Working Out        Developing a personalized nutrition plan.        About 22 million fitness app users in the U.S., many of whom are runners, might specifically seek AI-driven apps for personalized nutrition plans.
  A fintech app for contractors and freelancers to transact using an exclusive digital currency.        Cryptocurrency        Identifying scams and fraud schemes.        Over 5.7 million freelancers in the U.S. could potentially use a fintech app for transactions in a digital currency, focusing on avoiding scams and fraud schemes.
  A mobile app assisting consumers with low credit scores in credit recovery through personalized plans.        Financial Literacy        Managing credit and debt.        Approximately 68 million Americans with poor or fair credit scores could benefit from credit recovery mobile apps.
  A fintech mobile app automating savings and investing them in gold.        Budgeting/Saving        Setting and achieving financial goals.        The personal finance app market includes around 30 million users globally interested in apps that automate savings and investments in gold."`,

  USER: `“dataset1” below contains a list of business descriptions as well as an indication of how many potential customer that business may have. “input” below contains words associated with a business. 
  I want you to write a one sentence, short but unique business descriptions as well as an indication of how many potential customer that business may have by incorporating or directly associating the words in the “input” in user prompt.  
  You will write three different business descriptions and potential customers for the category and problem provided by user prompt.
    
  The format of the three business descriptions and potential customer should be an array containing three elements: The response should only contain the array.
  [{"businessDescription": [insert business description],"opportunityHighlight": [insert potential customers datapoint]]
  
  dataset1:
  “A gamified and story-driven application teaching coding in Python, HTML, CSS, or JavaScript.
  WHY THIS?
  Over 6 million individuals learn the coding languages Python, HTML, CSS, or JavaScript each year.”
  
  “An AI shopping assistant integrated into e-commerce platforms to personalize customer shopping experiences.
  WHY THIS?
  Approximately 1.8 billion people globally shop online.”
  
  “A LinkedIn post generator optimizing posts for audience engagement and personal branding.
  WHY THIS?
  Over 310 million monthly active users are on LinkedIn.”
  
  “A mobile app providing theft protection, insurance, roadside assistance, and on-demand repairs for e-bike owners.
  WHY THIS?
  More than 5 million e-bikes were sold globally in 2023.”
  
  “A digital Bitcoin art marketplace leveraging smart contracts and the Lightning Network for digital art asset exchanges.
  WHY THIS?
  The digital art market has over 1 million active buyers.”
  
  “A virtual poker app designed for friend groups, featuring chat and video interfaces for a social gaming experience.
  WHY THIS?
  An estimated 100 million people worldwide play poker.”
  
  “A text-to-audio app utilizing AI to customize human-like emotions in audio content.
  WHY THIS?
  There are 400 million audiobook listeners globally.”
  
  “A travel credit card tailored to the unique needs of Generation Z.
  WHY THIS?
  67 million Generation Z individuals are in the U.S.”
  
  “A brokerage firm enabling users to build custom ETFs based on their investment preferences and risk profile.
  WHY THIS?
  56% of Americans own stocks.”
  
  “A voice-to-action AI agent acting as a personal assistant, managing administrative tasks and life organization.
  WHY THIS?
  110 million users in the U.S. utilize virtual assistants.”
  
  “A fintech platform allowing Mexican nationals to earn US Dollars and pay in Mexican Pesos.
  WHY THIS?
  Over 1.5 million Mexican nationals currently live and work in the U.S.”
  
  “A marketplace streamlining the acquisition and transaction process of small businesses.
  WHY THIS?
  Annually, around 2.5 million small businesses are sold in the U.S.”
  
  “A marketplace for rare coins and precious metals, using auction data and historical pricing for accurate valuations.
  WHY THIS?
  There are over 5 million active collectors of coins and precious metals in the U.S.”
  
  “An AI-driven shopping platform where users can find clothing items based on inputted styles or looks.
  WHY THIS?
  390 million people globally prioritize sustainability as their number one driver for purchasing clothing.”
  
  “An AI-driven video game designer generating new maps, terrains, and resources for unpredictable gameplay.
  WHY THIS?
  Popular video games like Fortnite and Call of Duty have over 400 million users.”
  
  “A platform identifying the best plane ticket deals using exclusively credit card points.
  WHY THIS?
  18.9 million credit card holders redeemed points for airplane miles in 2023.”
  
  “An AI-driven news content writer focusing on niche current events for cost-effective article creation.
  WHY THIS?
  There are approximately 1.5 million digital news subscribers in the U.S..”
  
  “An app leveraging AI to create and share photos of users in imaginary situations on social media.
  WHY THIS?
  159 million Americans use photo editing apps each year.”
  
  “An AI-driven math tutor incorporating speech, text, and image recognition for personalized learning.
  WHY THIS?
  10.2 million students use math tutoring services each year.”
  
  “An AI-driven marketplace offering back-office tasks like lead generation or financial modeling at competitive prices.
  WHY THIS?
  Approx. 8 million small businesses use lead generation services each year.”
  
  “An AI and gamified nutrition coach allowing meal logging through photo recognition.
  WHY THIS?
  There are over 100 million health app users in the U.S..”
  
  “An AI-driven video animation creator transforming text inputs into short-form animations.
  WHY THIS?
  Over 40 million creators worldwide use video editing software.”
  
  “A multiplayer development platform providing game servers, matchmaking, and DDoS mitigation.
  WHY THIS?
  The global eSports audience is 474 million people.”
  
  “An AI search engine for academic research, answering questions with included citations.
  WHY THIS?
  38 million college students have expressed a need for more diverse educational resources.”
  
  “A mobile application optimizing app usage time for mental health benefits.
  WHY THIS?
  An estimated 200 million health app users are interested in apps for managing screen time.”`,

  COMPANY_NAME: `"You will suggest 4 unique business names (without explanations) based on the business description provided in the user prompt. Each suggestion will have different criteria also included below. Provide your response in a single array containing all 4 suggestions.
  
  suggestion 1 criteria: a real or fictional character's name that is either directly or loosely correlated to the business description.
  Example 1:
  - Business description: an AI music editing app with a rich library of sounds and beats that gives users high-quality music production at their finger tips.
  - Suggestion: Beethoven
  - Explanation: Beethoven, one of the most famous classical musicians ever, is universally recognizable for his association with music and his famous composing that is strongly metaphorical for a platform that democratizes high quality music production.
  Example 2: 
  - Business description: a gamified education platform for learning magic tricks and sharing best practices among the magician community
  - Suggestion: Houdini
  - Explanation: Harry Houdini, one of the most famous magicians of all time, is both associated with magic and his famous magic tricks are a beacon for a community of magicians.
  Example 3:
  - Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event 
  - Suggestion: Stockton
  - Explanation: John Stockton, famous for assists in the NBA, is both associated with sports and his smooth passing is a metaphor for a ticketing platform that allows you to buy and sell during an event.
  Example 4:
  - Business description: a dating app that pairs users based on their vision of their perfect married life
  - Suggestion: Pamela
  - Explanation: Pamela Anderson, a famous playboy playmate and supermodel, is both associated with romance and dating as well as famous for having a higher than usual amount of husbands, strongly associating her with a dating app that focuses on picturing your ideal married life.
  
  suggestion 2 criteria: a slang or fictitious one word name that has at least one of these letters: Z, Q, X, J, K, F, H, V, W, and Y, is 1-3 syllables, and has a double letter.
  Example 1:
  - Business description: an AI music editing app with a rich library of sounds and beats that gives users high-quality music production at their finger tips.
  - Suggestion: Razzmatazz
  - Explanation: Razzmatazz is a slang word for creative jazz music that emphasizes expression. this word would be well-suited for an app that allows musicians to use their creativity in producing their own music.
  Example 2: 
  - Business description: a gamified education platform for learning magic tricks and sharing best practices among the magician community
  - Suggestion: Zzephyr
  - Explanation: a modification of the word 'zephyr', a gentle breeze, this name could be associated with a magician who has control over air or weather elements, has the double letter ""zz"" and is two syllables
  Example 3:
  - Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event 
  - Suggestion: Hooper
  - Explanation: A slang name for a basketball player who is skilled and has the double letter ""oo"" and the letter ""h"" as well has two syllables
  Example 4:
  - Business description: a dating app that pairs users based on their vision of their perfect married life
  - Suggestion: Vowwy
  - Explanation: a modification of the word vow, associated with wedding vows, that has the letters ""V"" ""W"" ""Y"" and double letter ""ww"" as well as is two syllables
  
  suggestion 3 criteria: a direct and strong connection to the business description that is easy to pronounce, spell and say
  Example 1:
  - Business description: an AI music editing app with a rich library of sounds and beats that gives users high-quality music production at their finger tips.
  - Suggestion: Mixer AI
  - Explanation: A mixer is a piece of musical equipment that is used to mix sounds and has a very strong and literal correlation to an AI music editing app 
  Example 2: 
  - Business description: a gamified education platform for learning magic tricks and sharing best practices among the magician community
  - Suggestion: Spellbound
  - Explanation: spellbound is a word that describes someone who is directly under the influence of. magical spells and has a strong and direct correlation to a social and education app for magicians
  Example 3:
  - Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event 
  - Suggestion: VIP
  - Explanation: VIP is associated with a pass that is a special ticket usually issued to VIPs to get access to the field or court for many sporting games which would have a strong correlation to a sports ticketing platform
  Example 4:
  - Business description: a dating app that pairs users based on their vision of their perfect married life
  - Suggestion: Spouse
  - Explanation: spouse is a word to describe your marriage partner and is directly correlated to marriage, the goal of a dating platform that has you picture your ideal married life
  
  suggestion 3 criteria: a well-known real or fictitious place that is directly or loosely correlated to the business description
  Example 1:
  - Business description: an AI music editing app with a rich library of sounds and beats that gives users high-quality music production at their finger tips.
  - Suggestion: Woodstock
  - Explanation: woodstock, new york was a famous concert venue for 1960s and 1970s rock bands and their followers
  Example 2: 
  - Business description: a gamified education platform for learning magic tricks and sharing best practices among the magician community
  - Suggestion: Fantasia
  - Explanation: fantasia was the magical location of the movie a neverending story, full of magical and mythical beings and events
  Example 3:
  - Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event 
  - Suggestion: Daytona
  - Explanation: daytona is a location of nascar events as well as featured in various video games as a location of events
  Example 4:
  - Business description: a dating app that pairs users based on their vision of their perfect married life
  - Suggestion: Eden
  - Explanation: a place known for being paradise and associated with love"`,

  COMPANY_LOGO_: [
    `Based on the business name and business description provided, I want you to generate a business logo using below given Logo prompt. Make sure that if logo contains any text, it should be in english language words only. 
  Logo prompt:"[INSERT FIRST LETTER OF BUSINESS NAME]" simple logo, duotone, modern, one bright color, black background`,

    `Based on the business name and business description provided, I want you to generate a business logo using below given Logo prompt. Make sure that if logo contains any text, it should be in english language words only.
  Logo prompt"[INSERT BUSINESS NAME]" simple logo, duotone, bright colors`,

    `Logo prompt:"I want you to write one thing that is directly associated with the business description provided and would make a good logo for that business description. For example a business that involved an investing app might be directly associated with a bull or a bag of money, or a business that was a dating app might be a heart. The provided thing should be a maximum of two words (do not include an explanation of why you chose this). Make sure that if logo contains any text, it should be in english language words only.
  You will insert thing into the following quote as [THING]: simple vector graphic logo of [THING], flat, 2d, vibrant colors"`,

    `Logo prompt:"I want you to write one thing that is directly associated with the business description provided and would make a good logo for that business description. For example a business that involved an investing app might be directly associated with a bull or a bag of money, or a business that was a dating app might be a heart. The provided thing should be a maximum of two words (do not include an explanation of why you chose this). Make sure that if logo contains any text, it should be in english language words only.
  You will insert thing into the following quote as [THING]: simple vector graphic logo of [THING], flat, 2d`,
  ],

  COMPANY_LOGO: `"Provide a 1-5 word visual description of an engaging and distinctive object that vividly represents the core service or theme of the following business description. The visual description should include one of the specified design styles and an object that is not only directly related to the business but also visually striking and easily identifiable. The object should be something that can be rendered in a simple yet captivating manner in a logo design. Include a color if it enhances the visual appeal and relevance. Choose both a design style and an object that have unmistakable and exciting associations with the business description. Replace OBJECT with the chosen object and STYLE with the chosen style in the following format: 'simple logo of OBJECT, STYLE --v 6.0'. Avoid generic or abstract concepts in favor of concrete and visually stimulating elements.

  Styles: pixel art, contemporary 3d, synthwave, low poly art, flat, vibrant color
  
  Business description: [INSERT BUSINESS DESCRIPTION]
  
  Provide only the output without quotations or an explanation.
  
  Illustrative examples:
  
  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education
  Object: green bull
  Style: contemporary 3d 
  Output: simple logo of green bull, contemporary 3d --v 6.0
  
  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  Object: headphones
  Style: synthwave
  Output: simple logo of headphones, synthwave --v 6.0
  
  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them
  Object: sports car
  Style: pixel art
  Output: simple logo of sports car, pixel art --v 6.0
  
  Example 4
  Business description: a dating app that pairs users based on their vision of their perfect married life
  Object: diamond ring
  Style: low poly art
  Output: simple logo of diamond ring, low poly art --v 6.0"`,

  TARGET_AUDIENCE: `"Based on the business description provided in the user prompt, you will write three potential, very specific target audiences. Each separate target audience description will be formatted as one sentence where each characteristics of the target audience will be separated by a comma. The response should be an array containing three Target Audience strings. each target audience description should be no longer than 45 words. Each will highlight the 3-5 most important characteristics of the specific target audience potentially including age, gender, activities relating to social media habits (specific accounts they follow or groups, channels, #hashtags they are active members of or specific aspects of their own social media profile), specific jobs (including title and type of company), relationship status, wealth/income (specific not general), or other clubs, organizations, activities, habits that are all hyper-specific or niche. Here are 3 examples: 

  Example 1:
  Business description: a mobile application that coaches users through starting their first business, including gamified education, a daily action checklist and a human mentorship portal.
  Target audience: 16-19 years old, STEM students, located in start-up hotspots, have the word ""Founder"" in their LinkedIn profile, are the leader of a business club or student organization
  
  Example 2:
  Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event
  Target audience: 22-29 year old graduates of private universities or top-50 public colleges, young professionals at investment banks or large tech companies, members of reddit channels r/nba r/nfl r/soccer r/collegebasketball r/baseball r/collegefootball
  
  Example 3:
  Business description: a dating app that pairs users based on their vision of their perfect married life
  Target audience: 30-35 year old single females, members of Soulcycle, barry's bootcamp, Orangetheory, Pure Barre, equinox, followers of @kimkardashian @taylorswift @kayla_itsines on instagram`,

  COMPETITORS: `"Based on the business description provided in the user prompt, I want you to provide the 5 most direct competitors. 2 of these competitors should be well-known billion-dollar companies. The other 3 should be niche companies you would be unlikely to know unless you were very familiar with the specific industry or niche of the industry. The response should be an array containing a single string having all 5 competitors name without any explanation as provided in below examples. below are 3 illustrative examples:

  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  Competitors: ["Robinhood, TD Ameritrade, Stash, Bloom, Stockpile"]
  
  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  Competitors: ["Audacity, GarageBand, Mayk.it, sunhou.se, Volta"]
  
  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  Competitors: ["Jiffy Lube, Valvoline, Wrench, ServiceUp, Get Spiffy"]
  
  Example 4
  Business description: a mobile application that coaches users through starting their first business, including gamified education, a daily action checklist and a human mentorship portal
  Competitors: ["Shopify, HubSpot, Buildspace, Beta Blox, StartItUp"]`,

  KEY_DIFFERENTIATOR: `"Based on the business description provided in the user prompt, I want you to write 3 distinct potential core differentiators for. These core differentiators will be based on the incumbents of the industry and adjacent products. They will identify opportunities either through product differentiation or distribution. The core differentiator should be one concise phrase and emulate the examples provided below. The response should be an array containing three core differentiators strings. Below are 4 illustrative examples:

  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  Core differentiator: Creating a social eco-system for existing school and college communities
  Explanation: While many incumbents have investing apps with gamified education and social investing, the distribution channel of high school and college students is unique while occupying a large population of people interesting in learning about investing and a social finance community.
  
  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  Core differentiator: A rich content library of musical sounds and beats for endless creation.
  Explanation: While many incumbents have easy to use software for music editing, few of them focus on a large library of sounds and beats. Differentiating on a rich content library has proven successful in other industries like design (Canva) and education (Coursera) while music is one of the most common hobbies in the world (big market).
  
  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  Core differentiator: increased accessibility and service convenience by providing an at-home distribution 
  Explanation: For routine car maintenance, all current incumbent have a phyical location that consumers are required to go to, in order to provide services like tire rotation, oil changes, replaing air conditioning filters, etc. This model greatly increases accessibility and convenience for the end user.
  
  Example 4
  Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event
  Core differentiator: during-event ticket sales 
  Explanation: ticket platforms currently only users to buy tickets prior to the event, whereas a service that allowed reselling during the event, opens up additonal revenue options for the event host as well increased ticket availability to event users.`,

  X_FOR_Y: `"Based on the business description provided in the user prompt, I want you to write 4 metaphorical ""[COMPANY] for [THING]"" often referred to as ""X for Y"". The [COMPANY] you choose must be a well-known company that people would be farmiliar with. The [THING] should be directly related to the industry or niche based on the business description provided in user prompt. The response should be an array containing four generated strings. You will NOT include an explanation in your response. Below are 4 illustrative examples:

  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  X for Y: Duolingo for investing
  Explanation: Duolingo includes many of the same features such as gamified education and a social community but for a different industry
  
  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  X for Y: Canva for music
  Explanation: Canva is well known for its rich library of templates and designs but for digital design instead of music.
  
  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  X for Y: Rover for routine car maintenance
  Explanation: Rover also includes a monthly subscription fee for a common and routine service, but is a dog walking app not a car maintenance platform.
  
  Example 4
  Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event
  X for Y: Hoteltonight for event tickets
  Explanation: Hoteltonight also focuses on last minute luxury deals but is a hotel booking platform, not event ticketing.`,
};
