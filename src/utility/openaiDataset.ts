"use strict";
export const SYSTEM_INPUT = {
  SYSTEM: `Based on the provided user problem, write three one sentence distinct technology business descriptions that require minimal initial capital investment and can be launched with basic technical expertise. The technology used should be simple and based on widely available tools such as web or mobile app development, without involving advanced technologies like virtual reality or complex machine learning algorithms. Do not mention other industry or solution you drew inspiration from.

  On the top line you will write a 25 word or less detailed description of the business. This description will predominantly detail (1) a novel product feature not typically associated with the problem but draws inspiration from other industries or solutions or  (2) a specific underserved niche audience that is not the current core user group of an incumbent. 
  
  On the second line you will write opportunityHighlight for each business in six words or less in the format of X for Y. X will be a well known brand or company that is known for the shared feature between it and the business described in line one. Y will be a short phrase relating to the unique aspect of the business that differentiates it from incumbents or other solutions.
  
  Present your response in an array format, containing three objects, each object contains one business description and its opportunity highlight.
  
  Here are two illustrative examples:
  
  Problem: Finding convenient, budget-friendly and high-quality meals
  BusinessDescription: A food delivery app that captures efficiency by pooling orders by school and delivers during the high school lunch period, allowing high schoolers below driving age or restricted by school rules to access off-campus food options.
  OpportunityHighlight: GrubHub for High School Lunch
  
  Problem: Understanding blockchain technology and cryptocurrency investing
  BusinessDescription: A mobile app for first-time cryptocurrency investors with a learn to earn feature, allowing users to earn fractional amounts of cryptocurrency for learning about blockchain technology.
  OpportunityHighlight: STEPN for Blockchain Education
  
  Desired Output Format Example:
   [{"businessDescription": [insert business description],"opportunityHighlight": [insert opportunity highlight]]
      
  Instruction for Enhanced Precision: Ensure the output is formatted to exclusively include the business description and opportunity highlight within an array, adhering to the detailed criteria provided.`,

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

  COMPANY_NAME: `Generate four unique business names based on the provided business description. Each name should meet distinct criteria outlined below, and present your suggestions in a straightforward array format. Avoid including explanations or the business description in your final output.

  Criteria for Each Business Name Suggestion:
  Suggestion 1 criteria: a real or fictional character's name that is either directly or loosely correlated to the business description.
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
    
  Suggestion 2 criteria: a slang or fictitious one word name that has at least one of these letters: Z, Q, X, J, K, F, H, V, W, and Y, is 1-3 syllables, and has a double letter.
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
    
  Suggestion 3 criteria: a direct and strong connection to the business description that is easy to pronounce, spell and say
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
    
  Suggestion 4 criteria: a well-known real or fictitious place that is directly or loosely correlated to the business description
    Example 1:
    - Business description: an AI music editing app with a rich library of sounds and beats that gives users high-quality music production at their finger tips.
    - Suggestion: Woodstock
    - Explanation: woodstock, new york was a famous concert venue for 1960s and 1970s rock bands and their followers
    Example 2: 
    - Business description: a gamified education platform for learning magic tricks and sharing best practices among the magician community
    - Suggestion: Fantasia
    - Explanation: fantasia was the magical location of the movie a never ending story, full of magical and mythical beings and events
    Example 3:
    - Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event 
    - Suggestion: Daytona
    - Explanation: daytona is a location of nascar events as well as featured in various video games as a location of events
    Example 4:
    - Business description: a dating app that pairs users based on their vision of their perfect married life
    - Suggestion: Eden
    - Explanation: a place known for being paradise and associated with love"
  
  Output Format Expectation:
  Ensure the response is formatted as an array containing all four business name suggestions, strictly adhering to the criteria provided for each. Also, each business name should not exceed the character limit of 15 character. The output should look similar to this template, omitting any explanations for the choices:
  ["Oberon", "Buzzify", "WeddingWink", "Verona"]
  
  Instruction for Enhanced Precision: Ensure the output is formatted to exclusively include the company names within an array, adhering to the detailed criteria provided. The output must not contain the business description or any additional explanatory text. Strictly ensure that each company name does not exceed 15 characters.`,

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

  COMPANY_LOGO: `"Provide a 1-5 word visual description of an engaging and distinctive object that vividly represents the core service or theme of the following business description. The visual description should include one of the specified design styles and an object that is not only directly related to the business but also visually striking and easily identifiable. The object should be something that can be rendered in a simple yet captivating manner in a logo design. Include a color if it enhances the visual appeal and relevance. Choose both a design style and an object that have unmistakable and exciting associations with the business description. Replace OBJECT with the chosen object and STYLE with the chosen style in the following format: 'simple logo of OBJECT, STYLE --v 5.2 --turbo'. Avoid generic or abstract concepts in favor of concrete and visually stimulating elements.

  Styles: pixel art, contemporary 3d, synthwave, low poly art, flat, vibrant color
  
  Business description: [INSERT BUSINESS DESCRIPTION]
  
  Provide only the output without quotations or an explanation.
  
  Illustrative examples:
  
  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education
  Object: green bull
  Style: contemporary 3d 
  Output: simple logo of green bull, contemporary 3d --v 5.2 --turbo
  
  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  Object: headphones
  Style: synthwave
  Output: simple logo of headphones, synthwave --v 5.2 --turbo
  
  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them
  Object: sports car
  Style: pixel art
  Output: simple logo of sports car, pixel art --v 5.2 --turbo
  
  Example 4
  Business description: a dating app that pairs users based on their vision of their perfect married life
  Object: diamond ring
  Style: low poly art
  Output: simple logo of diamond ring, low poly art --v 5.2 --turbo"`,

  TARGET_AUDIENCE: `Generate three distinct and highly specific target audience profiles based solely on the provided business description. Each profile should be formatted as a concise sentence, not exceeding 45 words, detailing 3-5 pivotal characteristics such as age, gender, specific social media interactions, precise job titles, relationship status, clear income levels, or particular interests and activities. The output should strictly be an array containing only these three target audience descriptions, without including the business description or any other context. Ensure each entry in the array focuses on niche or hyper-specific audience traits.

  Business Description Examples and Corresponding Target Audiences:
  Example 1:
  Business Description: A mobile app for first-time business starters with gamified learning, daily tasks, and mentorship.
  Target Audience: "16-19 years old, STEM students, in startup hotspots, with 'Founder' in their LinkedIn, lead a business club/student organization."
  
  Example 2:
  Business Description: A live sports event ticketing platform for buying and selling tickets.
  Target Audience: "22-29 years, private university grads or top-50 public college alumni, young professionals in banks/tech, reddit members of sports channels."
  
  Example 3:
  Business Description: A dating app matching users on their ideal married life vision.
  Target Audience: "30-35 year old single females, members of premium fitness clubs, followers of @kimkardashian @taylorswift @kayla_itsines on Instagram."
  
  Desired Output Format Example (without actual business description):
  ["25-35 year old male, gym enthusiasts, registered on fitness apps like MyFitnessPal or Nike Training Club, follow fitness influencers like @therock or @schwarzenegger on Instagram, frequently shop from online apparel brands", "30-40 year old female, fashion enthusiasts, active Pinterest users, followers of @ChiaraFerragni, @SongofStyle on Instagram, customers of online fashion brands offering size guides", "20-28 year old college students, fans of fast fashion, active users of TikTok fashion hashtags, follower of fashion influencers like @emmachamberlain, regular shoppers at Zara, H&M or Forever 21."]
  
  Instruction for Enhanced Precision: Ensure the output is formatted to exclusively include the target audience descriptions within an array, adhering to the detailed criteria provided. The output must not contain the business description or any additional explanatory text.`,

  COMPETITORS: `Identify 5 most direct company competitors based solely on the provided business description. 2 of these competitors should be well-known billion-dollar companies. The other 3 should be niche companies you would be unlikely to know unless you were very familiar with the specific industry or niche of the industry. Present your findings as an array containing a single string, listing all five competitor names consecutively without any explanations. The array should not include the business description or any additional context.

  Business Description Examples and Corresponding Competitor:
  
  Example 1:
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  Competitors: ["Robinhood, TD Ameritrade, Stash, Bloom, Stockpile"]
    
  Example 2:
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  Competitors: ["Audacity, GarageBand, Mayk.it, sunhou.se, Volta"]
    
  Example 3:
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  Competitors: ["Jiffy Lube, Valvoline, Wrench, ServiceUp, Get Spiffy"]
    
  Example 4:
  Business description: a mobile application that coaches users through starting their first business, including gamified education, a daily action checklist and a human mentorship portal
  Competitors: ["Shopify, HubSpot, Buildspace, Beta Blox, StartItUp"]
  
  Desired Output Format Example (without actual business description):
  ["Shopify, HubSpot, Buildspace, Beta Blox, StartItUp"]
    
  Instruction for Enhanced Precision: Ensure the output is formatted to exclusively include the competitor company names within an array, adhering to the detailed criteria provided. The output must not contain the business description or any additional explanatory text.`,

  KEY_DIFFERENTIATOR: `Identify 3 distinct potential core differentiators based solely on the provided business description. These core differentiators will be based on the incumbents of the industry and adjacent products. Focus on highlighting distinct advantages in product features or distribution strategies. Each differentiator should be presented as a concise phrase, clearly encapsulating a competitive edge. Compile the differentiators into an array of three strings, without including explanations or the business description.

  Business Description Examples and Corresponding Core Differentiator:
  
  Example 1:
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  Core differentiator: Creating a social eco-system for existing school and college communities
  Explanation: While many incumbents have investing apps with gamified education and social investing, the distribution channel of high school and college students is unique while occupying a large population of people interesting in learning about investing and a social finance community.
    
  Example 2:
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  Core differentiator: A rich content library of musical sounds and beats for endless creation.
  Explanation: While many incumbents have easy to use software for music editing, few of them focus on a large library of sounds and beats. Differentiating on a rich content library has proven successful in other industries like design (Canva) and education (Coursera) while music is one of the most common hobbies in the world (big market).
    
  Example 3:
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  Core differentiator: increased accessibility and service convenience by providing an at-home distribution 
  Explanation: For routine car maintenance, all current incumbent have a physical location that consumers are required to go to, in order to provide services like tire rotation, oil changes, replacing air conditioning filters, etc. This model greatly increases accessibility and convenience for the end user.
    
  Example 4:
  Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event
  Core differentiator: during-event ticket sales 
  Explanation: ticket platforms currently only users to buy tickets prior to the event, whereas a service that allowed reselling during the event, opens up additional revenue options for the event host as well increased ticket availability to event users.
  
  Desired Output Format Example (without actual business description):
  ["In-app access to international cuisine recipes", "Nutritional information for every recipe", "Built-in grocery list creator based on selected recipes"]
    
  Instruction for Enhanced Precision: Ensure the output is formatted to exclusively include the differentiator within an array, adhering to the detailed criteria provided. The output must not contain the business description or any additional explanatory text.`,

  X_FOR_Y: `Utilizing the provided business description, craft four metaphorical 'X for Y' analogies that succinctly compare the business model to that of a well-known company, with 'X' being the company and 'Y' the industry or niche related to the provided business description. Choose 'X' from companies that are broadly recognized, ensuring 'Y' directly ties to the specific industry or niche of the provided business description. Present your analogies in an array format, containing four generated strings (each string not more than 40 characters), without including explanations or the business description.

  Business Description Examples and Corresponding X for Y:
  
  Example 1:
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  X for Y: Duolingo for investing
  Explanation: Duolingo includes many of the same features such as gamified education and a social community but for a different industry
    
  Example 2:
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  X for Y: Canva for music
  Explanation: Canva is well known for its rich library of templates and designs but for digital design instead of music.
    
  Example 3:
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  X for Y: Rover for routine car maintenance
  Explanation: Rover also includes a monthly subscription fee for a common and routine service, but is a dog walking app not a car maintenance platform.
    
  Example 4:
  Business description: a sports event ticketing platform that allows users to buy and sell tickets during the event
  X for Y: Hoteltonight for event tickets
  Explanation: Hoteltonight also focuses on last minute luxury deals but is a hotel booking platform, not event ticketing.
  
  Desired Output Format Example (without actual business description):
  ["Spotify for Emerging Artists", "Instagram for Musicians", "TikTok for Music Creation", "Pandora for Local Bands"]
      
  Instruction for Enhanced Precision: Ensure the output is formatted to exclusively include the X for Y within an array, adhering to the detailed criteria provided. The output must not contain the business description or any additional explanatory text. Strictly ensure that each "X For Y" phrase does not exceed 40 characters.`,

  HEADLINE: `"Based on the business description provided in the user prompt, I want you to provide 3 Business Headlines, with not more than 12 words each. The response should be only an array containing three headline string as provided in below examples. below are 3 illustrative examples:
  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  Headlines: ["Student Investors Thrive: Social App Revolutionizes Financial Learning!", "Empower Students: Gamified Finance App Sparks Social Investing Brilliance!", "Investing Fun for Students: Social App Gamifies Financial Wisdom!"]

  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  Headlines: ["Soundscapes Reimagined: AI-Powered Remixes of Your Favorite Hits", "Revolutionize Your Playlist: AI-Infused Versions of Classic Tunes", "Echoes of Tomorrow: Where AI Breathes New Life into Timeless Tracks]

  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  Headlines: ["Revolutionize Car Care: Membership App Delivers Auto Maintenance Right to You!", "Auto Bliss at Your Door: App Simplifies Maintenance with Membership Convenience!","Car Care on Demand: Membership App Brings Routine Maintenance to Your Door!"]

  Example 4
  Business description: a mobile application that coaches users through starting their first business, including gamified education, a daily action checklist and a human mentorship portal
  Headlines: ["Launch Success: Your Business Journey Starts Now with Our Guiding App!", "Startup Triumph: Unlock Business Success with Our Guiding Mobile App Experience!", "Launch Your Dream: Gamified Coaching App for First-Time Entrepreneurs!"]`,

  VALUE_CREATORS: `"Based on the business description provided in the user prompt, I want you to provide three strings, each string containing 3 Value Creators regarding that business, with not more than 3 words each. The response should be only an array containing three strings, with each string containing a combination of 3 value creator strings as provided in below examples. below are 3 illustrative examples:

  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  valueCreators: ["Youthful Investing. Gamified Finance Mastery. Transforming Futures.", "Social Wealth Hub. Empower Students Socially. Join the Movement.", "GameSmart Finance. Transform Students Socially. Level Up Finances."]
  
  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  valueCreators: ["AI music. Exploratory sounds. On your phone.", "Your Favorite Artists. Unheard songs. Always new.","Discover new music. For every mood. New playlists daily."]
  
  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  valueCreators: ["AutoCare Revolution. Simplify Car Maintenance. Effortless Auto Wellness.","Membership Magic. Car Care Delivered. Stress-Free Auto Maintenance.","Tech-Driven Car TLC. Subscription Auto Bliss. Hassle-Free Maintenance."]
  
  Example 4
  Business description: a mobile application that coaches users through starting their first business, including gamified education, a daily action checklist and a human mentorship portal
  valueCreators: ["Startup Mastery Hub. Guided Entrepreneurship. Daily Success Checklist.","Business Launchpad. Gamified Entrepreneurship. Mentorship at Fingertips.","Strategic Startups. Educate, Execute, Elevate. Daily Business Mentorship."]`,

  COLORS_AND_AESTHETIC: `"Based on the Business Description provided in the user prompt, I want you to provide 4 suggestion objects, where each object contains "Primary", "Secondary" and "Text" fields which has color hex codes compatible to the theme of the provided business description. The response should be only an array containing four objects as provided in below illustrative examples:

  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  Colors: [{"primary": "#247e6a", "secondary": "#ffcc00", "text": "#FFFFFF"}, {"primary": "#6a247e", "secondary": "#ffb300", "text": "#FFFFFF"}, {"primary": "#2e6c8a", "secondary": "#ff6600", "text": "#FFFFFF"}, {"primary": "#742677", "secondary": "#ffa31a", "text": "#FFFFFF"}]
  
  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  Colors: [{"primary": "#2F4F4F", "secondary": "#8A2BE2", "text": "#FFFFFF"}, {"primary": "#472C86","secondary": "#FFAB00","text": "#FFFFFF"}, {"primary": "#6A5ACD", "secondary": "#FFD700", "text": "#FFFFFF"}, {"primary": "#6D2077", "secondary": "#FF8C00", "text": "#FFFFFF"}]
  
  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  Colors: [{"primary": "#1E90FF", "secondary": "#FFD700", "text": "#000000"}, {"primary": "#32CD32", "secondary": "#FF4500", "text": "#000000"}, {"primary": "#4B0082", "secondary": "#FF6347", "text": "#000000"}, {"primary": "#800080", "secondary": "#FFA500", "text": "#000000"}]
  
  Example 4
  Business description: a mobile application that coaches users through starting their first business, including gamified education, a daily action checklist and a human mentorship portal
  Colors: [{"primary": "#3D9970", "secondary": "#FF4136", "text": "#000000"}, {"primary": "#2ECC40", "secondary": "#FF851B", "text": "#000000"}, {"primary": "#FFDC00", "secondary": "#001f3f", "text": "#FFFFFF"}, {"primary": "#FF4136", "secondary": "#3D9970", "text": "#000000"}]`,

  CALL_TO_ACTION: `"Based on the business description provided in the user prompt, I want you to provide 4 call-to-action strings of 2-4 words regarding that business, and strictly ensure that each call-to-action is no longer than 40 characters. The response should be only an array containing four call-to-action strings as provided in below illustrative examples:

  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  valueCreators: ["Invest Wisely Today","Join Financial Adventure","Start Your Investment Journey","Explore Social Investing Now"]

  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  callToAction: ["Listen Now", "Join Waitlist","Try Musaic for free","See Song Library"]

  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  valueCreators: ["Get AutoCare Now","Join Car Maintenance Club","Experience Easy Auto Service","Explore Membership Benefits"]

  Example 4
  Business description: a mobile application that coaches users through starting their first business, including gamified education, a daily action checklist and a human mentorship portal
  valueCreators: ["Start Your Business Journey","Join Entrepreneurial Coaching","Experience Gamified Learning","Explore Mentorship Opportunities"]`,

  BLOG_TOPIC: `"Based on the business description provided in the user prompt, I want you to provide 3 topics strings regarding that business. The response should be only an array containing three call-to-action strings as provided in below illustrative examples:

  Example 1
  Business description: an investing mobile app for high school and college students that promotes social investing and gamified financial education.
  Topic: ["Empowering students: Social investing through mobile apps","Gamified financial education: Making investing fun for students","The impact of investing on student communities: A closer look"]
  
  Example 2
  Business description: an AI music creation app with a rich library of sounds and beats as well as a strong community of musicians
  Topic: ["Is AI good or bad for art and music?", "How can listening to the right music increase productivity?","Why you should listen to an entire album and not just one song"]
  
  Example 3
  Business description: a mobile app that automates car maintenance, allowing car owners to pay a membership fee for routine auto care (like oil changes, tire rotation, etc) that comes to them.
  Topic: ["The future of auto care: Automating maintenance with mobile apps","Membership benefits: Convenient routine auto care for car owners","Revolutionizing car maintenance: Pay-as-you-go for oil changes and more"]
  
  Example 4
  Business description: a mobile application that coaches users through starting their first business, including gamified education, a daily action checklist and a human mentorship portal
  Topic: ["Is gamified education effective for business starters?","Unlocking success with daily business action items","The impact of human mentorship in business development"]`,

  WEBSITE_LINK: `"Based on the company name provided in the user prompt, I want you to provide 4 domain names regarding that company name. The response should be only an array containing four domain name string as provided in below illustrative examples:

  Example 1
  Company Name: Beethoven
  Website: ["Beethoven.com", "Beethoven.co","Beethoven.biz", "Beethoven.app"]

  Example 2
  Company Name: Musaic
  Website: ["Musaic.com", "Musaic.music","Trymusaic.xyz", "Musaic.co"]

  Example 3
  Company Name: AutoEase
  Website: ["AutoEaseHub.com", "CarCareEase.in", "EasyAutoCare.co", "CarMaintenanceEase.app"]

  Example 4
  Company Name: MentorCraft
  Website: ["MentorCraftHub.com", "MentorCraft.com","MentorCraftHub.io","MentorCraft.ai"]`,

  SYSTEM_PHYSICAL_PRODUCT: {
    DISRUPTION: `Objective: Generate a unique and innovative physical product business idea to solve the user problem in the input. An associated activity may also be included in the input before the problem to provide context. Prioritize generating truly unique and innovative ideas.
    The idea must correlate to one of the following market segments. Choose the segment that is closest to the user input from the list below:
    Portable Audio
    VR Headsets
    PC Gaming Hardware
    Action Figures
    Trading Cards
    Educational Toys
    Outdoor Gear
    BBQ Equipment
    Hiking Gear
    Electric Bikes
    Water Sports Equipment
    Leisure Products
    Adventure Equipment
    Gourmet Foods
    Luxury Clothing
    Luxury Accessories
    Luxury Outerwear
    Fast Fashion
    High-End Fashion
    Sustainable Fashion
    Streetwear
    Athleisure Clothing
    Athleisure Footwear
    Yoga Gear
    Fitness Accessories
    Running Accessories
    Supplements
    Home Gym Equipment
    Fitness Equipment
    Fitness Apparel
    Fitness Tracking
    Kitchen Appliances
    Health Foods
    Fitness Supplements
    Skincare Products
    Luxury Skincare
    Natural Skincare
    Luxury Makeup
    Professional Makeup
    Organic Makeup
    Dog Food
    Aromatherapy
    Mattresses
    Sleep Accessories
    Essential Oils
    Diffusers
    Natural Remedies
    Art Supplies
    Pickleball Equipment
    Autographed Merchandise
    Group Games
    Gift Items
    Party Games
    Beach Gear
    Food Tours
    Nutrition for Runners
    Cocktail Kits
    Vitamins & Minerals
    Dog Toys
    Dog Accessories
    Mindfulness Journals
    Aromatherapy for Sleep
    Plant Care Products
    Do not generate or use any market segments that are not included in this list.
    The idea will always be a physical product solution, not a software product or service business. The idea will focus on a specific niche and include one key differentiating feature that sets it apart from existing solutions for each.
    The idea should be groundbreaking, applying a novel approach not seen in the industry before. Consider the following aspects when crafting this idea:
    Offer a scalable solution that can be easily manufactured and distributed across multiple markets or geographies.
    Demonstrate strong brand loyalty and customer retention, where satisfied customers become advocates for the product.
    Leverage cutting-edge technologies (e.g., 3D printing, advanced robotics, smart materials) to create a significant competitive advantage or unique selling proposition.
    Disrupt traditional industries by introducing a dramatically more efficient, convenient, or cost-effective physical product alternative.
    Create a new market or category by offering a unique physical product that addresses previously unrecognized needs.
    Address a price-insensitive problem that consumers already pay money to solve, ensuring strong demand and revenue potential.
    Involve a streamlined supply chain and efficient manufacturing processes to ensure cost-effectiveness and profitability at scale.
    Describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. Also provide the market segment you chose the idea from in a separate line below the idea. Do not use any market segments that are not on the list.
    Lastly, generate a catchy short description for the business idea in 6 words or less. The description should generate curiosity while also clearly describing the business idea. Aim to highlight the unique value proposition. This will precede the business idea on its own line.
    After generating the idea, double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, revise your selection to use a segment from the list that best fits the generated idea.
    Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input:
    Finding eco-friendly children's toys
    Output:
    {
      "idea": "Eco-friendly Children's Blocks",
      "description": "Modular, eco-friendly building blocks made from recycled materials with interlocking mechanisms for enhanced stability and creativity.",
      "segment": "Educational Toys"
    }
    Input:
    Finding luxury sleepwear
    Output:
    {
      "idea": "Temperature-Regulating Luxury Sleepwear",
      "description": "Temperature-regulating luxury sleepwear with advanced fabric technology for optimal comfort and sleep quality.",
      "segment": "Luxury Clothing"
    }
    Input:
    Home Cooking. Organizing Kitchen Tools and Supplies
    Output:
    {
      "idea": "Modular Space-Saving Cookware",
      "description": "Smart, modular cookware set with interchangeable handles and lids, featuring space-saving stackable design for efficient storage and cooking.",
      "segment": "Kitchen Appliances"
    }
    Input:
    Health & Nutrition. Creating a supplement plan
    Output:
    {
      "idea": "DNA-personalized Nutrition Supplements",
      "description": "Personalized fitness supplements with DNA-based formulations for optimal nutrient absorption and performance enhancement.",
      "segment": "Fitness Supplements"
    }
    Input:
    Taking care of indoor plants
    Output:
    {
      "idea": "Smart Plant Care System",
      "description": "Smart plant care system with AI-driven watering, lighting, and nutrient dosing for optimal plant health and growth.",
      "segment": "Plant Care Products"
    }`,
    MARKET_SIZE: `Objective: Generate a unique and innovative physical product business idea to solve the user problem in the input. An associated activity may also be included in the input before the problem to provide context. Prioritize generating truly unique and innovative ideas. 

    The idea must correlate to one of the following market segments. Choose the segment that is closest to the user input from the list below: 
    Drawing Supplies
    Canvas and Paper
    Photography Accessories
    Writing Instruments
    Notebooks and Journals
    Calligraphy Sets
    Golf Equipment
    Tennis Equipment
    Golf Apparel
    Team Sports Equipment
    Team Apparel
    Training Equipment
    Swimwear
    Swim Accessories
    Swim Training Gear
    Festival Gear
    Concert Merchandise
    Portable Food & Drink
    Recording Equipment
    Music Merchandise
    Fan Apparel
    Concert Accessories
    Posters and Prints
    VR Accessories
    Coin Collecting Supplies
    Precious Metal Coins
    Currency Collecting
    Memorabilia Display Cases
    Replica Trophies
    Vintage Sports Memorabilia
    Board Games
    Antique Furniture
    Board Games
    Portable Food & Drink
    Picnic Supplies
    Party Supplies
    Outdoor Furniture
    Holiday Decorations
    Beverages
    Camping Food
    Fishing Gear
    Swimwear and Accessories
    Inflatable Water Toys
    Travel Accessories
    Team Building Kits
    Travel Gear
    Guidebooks and Maps
    Casual Shoes
    Exercise Accessories
    Bar Tools and Accessories
    Mixers and Syrups
    Specialty Ingredients
    Baking Tools and Accessories
    Baking Mixes
    Decorating Supplies
    Hair Color
    Nail Products
    Nail Care & Art
    Dog Food
    Cat Food
    Cat Toys
    Cat Accessories
    Small Animal Supplies
    Bird Supplies
    Reptile Supplies
    Bird Watching Supplies
    Meditation Cushions
    Gardening Tools
    Outdoor Furniture
    Nature Journals
    Aromatherapy Accessories
    Skis and Snowboards
    Audio Equipment
    Home Audio Systems
    Gaming Consoles
    Action Figures
    Historical Documents
    Rare Books
    BBQ Equipment
    Navigation Equipment
    Cycling Gear
    Fishing Boats
    Cooking Classes
    Fast Fashion
    Running Apparel
    Home Gym Equipment
    Home Gym Equipment
    Spirits and Liquors
    Styling Tools
    Makeup Products
    Binoculars and Scopes
    Mattresses
    Do not generate or use any market segments that are not included in this list. 
    The idea will always be a physical product solution, not a software product or service business. The idea will focus on a specific niche and include one key differentiating feature that sets it apart from existing solutions for each. 
    The idea should be groundbreaking, applying a novel approach not seen in the industry before. Consider the following aspects when crafting this idea:
    Innovates on product design by seamlessly integrating with existing user behaviors, environments, or complementary products.
    Innovates by optimizing a scarce resource through identifying a more efficient or effective use pattern and format.
    Innovates by being hyper-specific about the target user and use case to create a strong value proposition.
    Innovates on the product delivery format by creating a more effective way of reaching users of an existing product category.
    Innovates by combining seemingly unrelated or contrasting materials, functions, or design elements to create a unique and engaging product.
    Leverages the core strengths of the underlying technology or materials to solve a specific user problem.
    Empowers a user to express their creativity or personalize the product to their unique needs and preferences.
    Focuses on a well-known product category but targets an underserved and high-value use case or market segment.
    Avoids direct competition by positioning the product as a complement to established products or by targeting a niche market segment.
    Innovates by creating a product that adapts to the user's changing needs over time, encouraging long-term use and brand loyalty.
    Leverages sustainable materials, production methods, or circular economy principles to create a product with a strong environmental value proposition.
    Innovates by creating a product that simplifies or automates a complex or time-consuming task, thereby making it more accessible to a wider range of users.
    
    Describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. Also provide the market segment you chose the idea from in a separate line below the idea. Do not use any market segments that are not on the list.
    
    Lastly, generate an easy to understand short description for the business idea in 5 words or less. The description should generate curiosity while also clearly describing the business idea. Aim to highlight the unique value proposition. This will precede the business idea on its own line. 
    After generating the idea, double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, revise your selection to use a segment from the list that best fits the generated idea. 
    Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Finding affordable and convenient tennis lessons
    Output: 
    {
        "idea": "AI tennis coach racket",
        "description": "AI-powered tennis racket with real-time swing analysis and personalized coaching for skill improvement.",
        "segment": "Tennis Equipment"
    }
    Input: 
    A more personalized concert experience
    Output: 
    {
        "idea": "AR interactive concert glasses",
        "description": "Augmented reality concert glasses with real-time lyrics, artist info, and interactive visuals for enhanced experiences.",
        "segment": "Concert Accessories"
    }
    Input: 
    Repetitive board game content
    Output:
    {
        "idea": "User-generated modular board game",
        "description": "Collaborative board game with modular, user-generated content for endless replayability and creativity.",
        "segment": "Board Games"
    }
    Input: 
    Home gym. Maximizing Limited Space
    Output:
    {
        "idea": "VR compact home gym",
        "description": "Portable, compact home gym equipment with virtual reality integration for immersive, space-saving workouts.",
        "segment": "Home Gym Equipment"
    }
    Input: 
    Wildlife Observation & Care. Integrating Habitats and Feeders with Environmental Monitoring
    Output:
    {
        "idea": "Eco-friendly smart bird feeder",
        "description": "Eco-friendly, noise-canceling bird feeder with built-in camera for remote bird watching and conservation.",
        "segment": "Bird Watching Supplies"
    }`,
    COMPLEXITY: `Objective: Generate a unique and innovative physical product business idea to solve the user problem in the input. An associated activity may also be included in the input before the problem to provide context. Prioritize generating truly unique and innovative ideas. 

    The idea must correlate to one of the following market segments. Choose the segment that is closest to the user input from the list below: 
    Drawing Supplies
    Writing Instruments
    Notebooks and Journals
    Art Supplies
    Pickleball Equipment
    Team Sports Equipment
    Team Apparel
    Training Equipment
    Swimwear
    Swim Training Gear
    Festival Gear
    Concert Merchandise
    Portable Food & Drink
    Music Merchandise
    Fan Apparel
    Concert Accessories
    Action Figures
    Trading Cards
    Board Games
    Portable Food & Drink
    Party Supplies
    Gift Items
    Party Games
    Camping Food
    Swimwear and Accessories
    Travel Accessories
    Beach Gear
    Team Building Kits
    Fast Fashion
    Running Apparel
    Nutrition for Runners
    Bar Tools and Accessories
    Ingredients for Baking
    Baking Mixes
    Decorating Supplies
    Hair Care Products
    Nail Products
    Nail Care & Art
    Makeup Products
    Cat Food
    Cat Toys
    Cat Accessories
    Meditation Cushions
    Outdoor Furniture
    Nature Journals
    Aromatherapy Accessories
    Painting Supplies
    Canvas and Paper
    Calligraphy Sets
    Golf Apparel
    Swim Accessories
    Festival Apparel
    Posters and Prints
    Coin Collecting Supplies
    Currency Collecting
    Autographed Merchandise
    Memorabilia Display Cases
    Replica Trophies
    Picnic Supplies
    Group Games
    Holiday Decorations
    Baking Supplies
    Fishing Apparel
    Fishing Accessories
    Guidebooks and Maps
    Food Tours
    Yoga Gear
    Running Accessories
    Yoga Gear
    Exercise Accessories
    Cocktail Kits
    Specialty Ingredients
    Baking Tools and Accessories
    Dog Toys
    Dog Accessories
    Small Animal Supplies
    Bird Supplies
    Bird Watching Supplies
    Mindfulness Journals
    Aromatherapy for Sleep
    Diffusers
    Do not generate or use any market segments that are not included in this list. 
    The idea will always be a physical product solution, not a software product or service business. The idea will focus on a specific niche and include one key differentiating feature that sets it apart from existing solutions for each. 
    The idea should be groundbreaking, applying a novel approach not seen in the industry before. Consider the following aspects when crafting this idea:
    Leverage existing manufacturing processes and materials: The business idea should utilize well-established manufacturing processes and readily available materials, reducing the need for custom tooling or specialized production methods.
    Simple, focused product design: The core functionality and design of the physical product should be simple, intuitive, and focused on solving a specific problem, minimizing the complexity of production and assembly.
    Focus on niche markets: Target specific, underserved niches where competition is lower, and it's easier to gain traction with minimal resources.
    Minimize need for unique or complex components: The business idea should rely primarily on easily accessible, widely available, or off-the-shelf components, rather than requiring the development or sourcing of unique or complex parts.
    Low initial order quantities: The product should be designed in a way that allows for low minimum order quantities (MOQs) from manufacturers, reducing the upfront investment required for inventory.
    Utilize print-on-demand or dropshipping: Consider business models that leverage print-on-demand or dropshipping services, eliminating the need for inventory management and reducing upfront costs.
    Tap into existing distribution channels: The product should be well-suited for sale through established distribution channels, such as online marketplaces or retail stores, minimizing the need for building a proprietary distribution network.
    Minimize packaging and shipping complexity: The product design should allow for simple, cost-effective packaging and shipping methods, reducing the complexity and costs associated with fulfillment.
    
    Describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. Also provide the market segment you chose the idea from in a separate line below the idea. Do not use any market segments that are not on the list.
    
    Lastly, generate an easy to understand short description for the business idea in 5 words or less. The description should generate curiosity while also clearly describing the business idea. Aim to highlight the unique value proposition. This will precede the business idea on its own line. 
    After generating the idea, double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, revise your selection to use a segment from the list that best fits the generated idea. 
    Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Phone battery dies during long group hangouts
    Output: 
    {
        "idea": "Solar-charging beach umbrella",
        "description": "Customizable, modular beach umbrella with built-in sand anchors and solar-powered phone charger.",
        "segment": "Beach Gear"
    }
    Input: 
    Holidays, Birthdays & Traditions. Finding fun and unique decorations or party accessories
    Output:
    {
        "idea": "Eco-friendly plantable party confetti",
        "description": "Eco-friendly, biodegradable confetti and streamers made from plantable seed paper for sustainable celebrations.",
        "segment": "Party Supplies"
    } 
    Input: 
    Inconsistent golf grip and comfort
    Output:
    {
        "idea": "Adjustable grip-enhancing golf glove",
        "description": "Golf glove with built-in grip enhancers and adjustable tension for improved comfort and swing consistency.",
        "segment": "Golf Apparel"
    } 
    Input: 
    Affording rare coins
    Output:
    {
        "idea": "Collectible mystery coin sets",
        "description": "Collectible, mystery coin sets with themed packaging and varying rarity levels for exciting, accessible collecting.",
        "segment": "Coin Collecting Supplies"
    } 
    Input: 
    Staying hygienic during culinary adventures
    Output:
    {
        "idea": "Self-sanitizing portable travel utensils",
        "description": "Portable, compact travel utensil set with built-in sanitizing case for hygienic, on-the-go dining.",
        "segment": "Travel Accessories"
    }`,
  },

  SYSTEM_SOFTWARE_TECHNOLOGY: {
    DISRUPTION: `Objective: Generate a unique and innovative software business idea to solve the user problem in the input. An associated activity may also be included in the input before the problem to provide context. Prioritize generating truly unique and innovative ideas.
    The idea must correlate to one of the following market segments. Choose the segment that is closest to the user input from the list below:
    Art Education Platforms
    Photo Editing Mobile Apps
    Photo Book Creation Software
    Sports Management Software
    Athlete Performance Tracking Software
    Fitness and Training Apps
    Sports Streaming and Media Platforms
    Fantasy Sports Platforms
    Sports Betting Software
    Fan Engagement and Loyalty Platforms
    Music Publishing and Royalty Management Platforms
    Online Music Marketplaces
    Music Learning Apps
    Concert Services & Livestreaming
    Music Collaboration Tools
    AI Music Composition Tools
    Virtual Reality Gaming
    Blockchain Gaming Platforms
    Cloud Gaming Services
    Stock Trading Platforms
    Robo-Advisors
    Personal Finance Software
    Cryptocurrency Exchanges
    Wealth Management Software
    Insurance Tech Platforms
    Social Media Platforms
    Group Activity Planning Apps
    Virtual Reality Social Platforms
    Cycling Apps
    Virtual Tour and Local Guide Platforms
    Tour Planning Software
    Virtual Try-On Apps
    Fashion Resale and Secondhand Platforms
    Custom Tailoring Apps
    Personal Styling Apps
    Online Ticket Booking Platforms
    Online Film Festivals
    VR Film Experiences
    AI Script Writing Tools
    Streaming Service Aggregators
    Meal Kit Delivery Services
    Recipe Apps
    Nutrition Tracking Apps
    Online Cooking Classes and Platforms
    Food Waste Reduction Apps
    Food Allergy Management Apps
    Dating Apps
    Couple Goal Tracking Platforms
    Virtual Date Ideas Apps
    Couples' Communication Apps
    Romantic Getaway Booking Apps
    Relationship Counseling Apps
    Gifting Apps
    Online Proposal Planning Services
    Online Tutoring Services
    Virtual Field Trip Platforms
    Do not generate or use any market segments that are not included in this list.
    
    The idea will always be a software solution, not a physical product. The idea will focus on a specific niche and include one key differentiating feature that sets it apart from existing solutions for each. The idea should be groundbreaking, applying a novel approach not seen in the industry before. Consider the following aspects when crafting this idea:
    Innovates on UI/UX format by meeting users where they already are by integrating with existing platforms, behaviors, or technologies.
    Innovates by optimizing a scarce resource by identifying a more efficient or effective use pattern and format.
    Innovates by being hyper-specific about the target user and use case to create a strong value proposition.
    Innovates on the UI/UX format by creating a more effective way of reaching users of an existing product.
    Innovates by combining seemingly unrelated or contrasting elements to create a unique and engaging experience.
    Leverages the core strengths of the underlying technology to solve a specific user problem.
    Empowers a user to express their creativity or become creators themselves.
    Focus on a well-known product but target an underserved and high-value use case.
    Avoids direct competition by integrating between established platforms or market segments.
    
    Describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. Also provide the market segment you chose the idea from in a separate line below the idea. Do not use any market segments that are not on the list.
    
    Lastly, generate a catchy "X for Y" analogy for the business idea in 6 words or less. The analogy should concisely convey the core concept by comparing it to a well-known successful company or product (X) being applied to a new domain or market (Y). Aim to highlight the unique value proposition. This will precede the business idea on its own line.
    
    After generating the idea, double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, revise your selection to use a segment from the list that best fits the generated idea.
    Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Educating a toddler without cringe youtube videos
    Output: 
    {
      "idea": "JibJab for Educational Kids' Music Videos",
      "description": "Parents upload a voice recording and picture to create educational music videos, like popular YouTube kids' channels, featuring them as the performer.",
      "segment": "Music Learning Apps"
    }
    Input: 
    Sports/Fitness. Finding available exercise equipment at the gym
    Output:
    {
      "idea": "OpenTable for Smart Gym Equipment Bookings",
      "description": "An app that integrates with gym equipment to reserve machines and optimize workout plans based on real-time availability and user goals.",
      "segment": "Fitness and Training Apps"
    } 
    Input: 
    Getting unfairly banned by game moderators
    Output:
    {
      "idea": "Reddit for Decentralized Game Moderation",
      "description": "A decentralized moderation system where the community votes on content and behavior moderation, ensuring fair and transparent enforcement.",
      "segment": "Blockchain Gaming Platforms"
    } 
    Input: 
    Fantasy Sports. Sparking more interaction in fantasy league SMS threads
    Output:
    {
      "idea": "WhatsApp for Fantasy Recaps",
      "description": "An integration that sends weekly fantasy recaps to group chats/SMS threads, sparking fun league conversations with data-driven insights.",
      "segment": "Fantasy Sports Platforms"
    } 
    Input: 
    Photography. Making photo editing easier
    Output:
    {
      "idea": "Siri for Voice-Controlled Photo Editing",
      "description": "An app that allows users to apply photo edits and effects using voice commands, making the editing process more accessible.",
      "segment": "Photo Editing Mobile Apps"
    }`,
    MARKET_SIZE: `Objective: Generate a unique and innovative software business idea to solve the user problem in the input. An associated activity may also be included in the input before the problem to provide context. Prioritize generating truly unique and innovative ideas.
    The idea must correlate to one of the following market segments. Choose the segment that is closest to the user input from the list below:
    Sports Analytics Software
    Fitness and Training Apps
    Sports Streaming and Media Platforms
    Fantasy Sports Platforms
    Sports Event Ticketing Software
    Music Streaming Services
    Music Production Software
    AI Music Composition Tools
    Mobile Gaming Apps
    Virtual Reality Gaming
    Blockchain Gaming Platforms
    Cloud Gaming Services
    Stock Trading Platforms
    Robo-Advisors
    Cryptocurrency Exchanges
    P2P Lending Platforms
    Insurance Tech Platforms
    Social Media Platforms
    Messaging Apps
    Virtual Reality Social Platforms
    Cycling Apps
    Online Travel Agencies
    Car Rental Apps
    Fashion E-commerce Platforms
    Fashion Resale and Secondhand Platforms
    Subscription Box Services
    Video Streaming Services
    Video on Demand (VOD) Services
    Meal Kit Delivery Services
    Grocery Delivery Services
    Food Delivery Apps
    Online Learning Platforms
    Educational Apps and Game Platforms
    Language Learning Software
    Virtual Classroom Platforms
    Corporate Training Software
    E-books and Digital Libraries
    Learning Management Systems (LMS)
    Do not generate or use any market segments that are not included in this list.
    
    The idea will always be a software solution, not a physical product. The idea will focus on a specific niche and include one key differentiating feature that sets it apart from existing solutions for each. The idea should be groundbreaking, applying a novel approach not seen in the industry before. Consider the following aspects when crafting this idea:
    Offer a scalable solution that can be easily replicated and deployed across multiple markets or geographies.
    Demonstrate strong network effects, where the value of the product or service increases as more users adopt it.
    Leverage cutting-edge technologies (e.g., AI, blockchain, IoT) to create a significant competitive advantage or barrier to entry.
    Disrupt traditional industries by introducing a dramatically more efficient, convenient, or cost-effective alternative.
    Create a new market or category by offering a unique value proposition that addresses previously unrecognized needs.
    Address a price-insensitive problem that consumers already pay money to solve, ensuring strong demand and revenue potential.
    Involves a fully automated, technology-driven solution that can create value for millions of users without requiring manual or human intervention, ensuring exceptional scalability.
    
    Describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. Also provide the market segment you chose the idea from in a separate line below the idea. Do not use any market segments that are not on the list.
    
    Lastly, generate a catchy "X for Y" analogy for the business idea in 6 words or less. The analogy should concisely convey the core concept by comparing it to a well-known successful company or product (X) being applied to a new domain or market (Y). Aim to highlight the unique value proposition. This will precede the business idea on its own line.
    
    After generating the idea, double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, revise your selection to use a segment from the list that best fits the generated idea.
    Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input:
    Jobs/Careers. Preparing for a career switch
    Output:
    {
      "idea": "Roblox for Career Exploration",
      "description": "A mobile app that allows users to virtually explore careers, learn required skills, complete simulated tasks, and build a professional portfolio.",
      "segment": "Educational Apps and Game Platforms"
    }
    Input:
    Sports/Fitness. Finding available exercise equipment at the gym
    Output:
    {
      "idea": "OpenTable for Smart Gym Equipment Bookings",
      "description": "An app that integrates with gym equipment to reserve machines and optimize workout plans based on real-time availability and user goals.",
      "segment": "Fitness and Training Apps"
    }
    Input:
    Finding music to pair with edited videos or other content
    Output:
    {
      "idea": "Spotify for Storytelling",
      "description": "A platform that generates dynamic soundtracks for stories and narratives, with AI adapting the music to fit the plot twists, character emotions, and scenes.",
      "segment": "AI Music Composition Tools"
    }
    Input:
    Gaming. Lack of true ownership in gaming
    Output:
    {
      "idea": "Minecraft for Blockchain",
      "description": "A sandbox game where players can build, own, and trade virtual lands and assets using blockchain, with in-game items having real-world value through NFTs.",
      "segment": "Blockchain Gaming Platforms"
    }
    Input:
    Finance/Investing. Creating a balanced and diversified investment portfolio
    Output:
    {
      "idea": "Hedgeye for AI-Driven Hedging Strategies",
      "description": "A platform that uses AI to develop and execute hedging strategies, protecting portfolios from downside risk.",
      "segment": "Stock Trading Platforms"
    }`,
    COMPLEXITY: `Objective: Generate a unique and innovative software business idea to solve the user problem in the input. An associated activity may also be included in the input before the problem to provide context. Prioritize generating truly unique and innovative ideas.
    The idea must correlate to one of the following market segments. Choose the segment that is closest to the user input from the list below:
    Photo Editing Software
    Graphic Design Software
    Online Art Marketplaces
    Art Education Platforms
    Stock Photography Platforms
    Digital Art and Portfolio Platforms
    Photo Editing Mobile Apps
    Digital Painting Software
    Photo Book Creation Software
    Sports Management Software
    Fitness and Training Apps
    Fan Engagement and Loyalty Platforms
    Music Learning Apps
    DJ Software
    Cycling Apps
    Fishing Apps
    Tour Planning Software
    Travel Blogging Platforms
    Travel Journal and Itinerary Apps
    Custom Tailoring Apps
    Subtitle and Dubbing Software
    Recipe Apps
    Food Blogging Platforms
    Food Waste Reduction Apps
    Food Allergy Management Apps
    Couple Goal Tracking Platforms
    Virtual Date Ideas Apps
    Couples' Communication Apps
    Gifting Apps
    Online Proposal Planning Services
    Test Preparation Apps
    Do not generate or use any market segments that are not included in this list.
    
    The idea will always be a software solution, not a physical product. The idea will focus on a specific niche and include one key differentiating feature that sets it apart from existing solutions for each. The idea should be groundbreaking, applying a novel approach not seen in the industry before. Consider the following aspects when crafting this idea:
    Leverage existing platforms and APIs: The business idea should utilize well-established platforms and APIs, reducing the need for custom development and minimizing technical complexity.
    Simple, focused functionality: The core functionality of the software should be simple, intuitive, and focused on solving a specific problem, reducing the scope of development required.
    Focus on niche markets: Target specific, underserved niches where competition is lower, and it's easier to gain traction with minimal resources.
    Minimize need for unique or complex data: The business idea should rely primarily on easily accessible, widely available, or user-generated data, rather than requiring the collection or processing of unique or complex data sets.
    
    Describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. Also provide the market segment you chose the idea from in a separate line below the idea. Do not use any market segments that are not on the list.
    
    Lastly, generate a catchy "X for Y" analogy for the business idea in 6 words or less. The analogy should concisely convey the core concept by comparing it to a well-known successful company or product (X) being applied to a new domain or market (Y). Aim to highlight the unique value proposition. This will precede the business idea on its own line.
    
    After generating the idea, double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, revise your selection to use a segment from the list that best fits the generated idea.
    Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Music. Developing songwriting skills
    Output:
    {
      "idea": "Grammarly for Songwriting",
      "description": "An app that provides songwriting prompts, tools, and feedback, helping users develop their songwriting abilities and create original music.",
      "segment": "Music Learning Apps"
    } 
    Input: 
    Mental Health. Finding moments of relaxation
    Output:
    {
      "idea": "Calm for Photo Therapy",
      "description": "A mobile app that combines mindfulness exercises with photo editing tasks to promote relaxation, creativity, and mental well-being.",
      "segment": "Photo Editing Mobile Apps"
    } 
    Input: 
    Staying in touch with friends virtually
    Output:
    {
      "idea": "WhatsApp for Automated Photo Book Sharing",
      "description": "An app that automatically creates and shares photo book memories with friends and family via group texts on special occasions and anniversaries.",
      "segment": "Photo Book Creation Software"
    } 
    Input: 
    Sports/Fitness. Fitting workouts into a busy daily routine
    Output:
    {
      "idea": "HIIT for Micro-Workouts",
      "description": "An app offering 5-10 minute micro-workouts tailored to specific fitness goals and schedules, fitting seamlessly into daily routines.",
      "segment": "Fitness and Training Apps"
    } 
    Input: 
    Watching Sports. Staying engaged during live sporting events
    Output:
    {
      "idea": "Twitter for Real-Time Fan Polls",
      "description": "An app that conducts real-time polls during games and events, allowing fans to vote on various aspects like player of the match, game strategies, and more.",
      "segment": "Fan Engagement and Loyalty Platforms"
    }`,
  },

  SYSTEM_CONTENT: {
    DISRUPTION: `Objective: Generate a unique and innovative software business idea to solve the user problem in the input. An associated activity may also be included in the input before the problem to provide context. Prioritize generating truly unique and innovative ideas.
    The idea must correlate to one of the following market segments. Choose the segment that is closest to the user input from the list below:
    Art Education Platforms
    Photo Editing Mobile Apps
    Photo Book Creation Software
    Sports Management Software
    Athlete Performance Tracking Software
    Fitness and Training Apps
    Sports Streaming and Media Platforms
    Fantasy Sports Platforms
    Sports Betting Software
    Fan Engagement and Loyalty Platforms
    Music Publishing and Royalty Management Platforms
    Online Music Marketplaces
    Music Learning Apps
    Concert Services & Livestreaming
    Music Collaboration Tools
    AI Music Composition Tools
    Virtual Reality Gaming
    Blockchain Gaming Platforms
    Cloud Gaming Services
    Stock Trading Platforms
    Robo-Advisors
    Personal Finance Software
    Cryptocurrency Exchanges
    Wealth Management Software
    Insurance Tech Platforms
    Social Media Platforms
    Group Activity Planning Apps
    Virtual Reality Social Platforms
    Cycling Apps
    Virtual Tour and Local Guide Platforms
    Tour Planning Software
    Virtual Try-On Apps
    Fashion Resale and Secondhand Platforms
    Custom Tailoring Apps
    Personal Styling Apps
    Online Ticket Booking Platforms
    Online Film Festivals
    VR Film Experiences
    AI Script Writing Tools
    Streaming Service Aggregators
    Meal Kit Delivery Services
    Recipe Apps
    Nutrition Tracking Apps
    Online Cooking Classes and Platforms
    Food Waste Reduction Apps
    Food Allergy Management Apps
    Dating Apps
    Couple Goal Tracking Platforms
    Virtual Date Ideas Apps
    Couples' Communication Apps
    Romantic Getaway Booking Apps
    Relationship Counseling Apps
    Gifting Apps
    Online Proposal Planning Services
    Online Tutoring Services
    Virtual Field Trip Platforms
    Do not generate or use any market segments that are not included in this list.
    
    The idea will always be a software solution, not a physical product. The idea will focus on a specific niche and include one key differentiating feature that sets it apart from existing solutions for each. The idea should be groundbreaking, applying a novel approach not seen in the industry before. Consider the following aspects when crafting this idea:
    Innovates on UI/UX format by meeting users where they already are by integrating with existing platforms, behaviors, or technologies.
    Innovates by optimizing a scarce resource by identifying a more efficient or effective use pattern and format.
    Innovates by being hyper-specific about the target user and use case to create a strong value proposition.
    Innovates on the UI/UX format by creating a more effective way of reaching users of an existing product.
    Innovates by combining seemingly unrelated or contrasting elements to create a unique and engaging experience.
    Leverages the core strengths of the underlying technology to solve a specific user problem.
    Empowers a user to express their creativity or become creators themselves.
    Focus on a well-known product but target an underserved and high-value use case.
    Avoids direct competition by integrating between established platforms or market segments.
    
    Describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. Also provide the market segment you chose the idea from in a separate line below the idea. Do not use any market segments that are not on the list.
    
    Lastly, generate a catchy "X for Y" analogy for the business idea in 6 words or less. The analogy should concisely convey the core concept by comparing it to a well-known successful company or product (X) being applied to a new domain or market (Y). Aim to highlight the unique value proposition. This will precede the business idea on its own line.
    
    After generating the idea, double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, revise your selection to use a segment from the list that best fits the generated idea.
    Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Educating a toddler without cringe youtube videos
    Output: 
    {
      "idea": "JibJab for Educational Kids' Music Videos",
      "description": "Parents upload a voice recording and picture to create educational music videos, like popular YouTube kids' channels, featuring them as the performer.",
      "segment": "Music Learning Apps"
    }
    Input: 
    Sports/Fitness. Finding available exercise equipment at the gym
    Output:
    {
      "idea": "OpenTable for Smart Gym Equipment Bookings",
      "description": "An app that integrates with gym equipment to reserve machines and optimize workout plans based on real-time availability and user goals.",
      "segment": "Fitness and Training Apps"
    } 
    Input: 
    Getting unfairly banned by game moderators
    Output:
    {
      "idea": "Reddit for Decentralized Game Moderation",
      "description": "A decentralized moderation system where the community votes on content and behavior moderation, ensuring fair and transparent enforcement.",
      "segment": "Blockchain Gaming Platforms"
    } 
    Input: 
    Fantasy Sports. Sparking more interaction in fantasy league SMS threads
    Output:
    {
      "idea": "WhatsApp for Fantasy Recaps",
      "description": "An integration that sends weekly fantasy recaps to group chats/SMS threads, sparking fun league conversations with data-driven insights.",
      "segment": "Fantasy Sports Platforms"
    } 
    Input: 
    Photography. Making photo editing easier
    Output:
    {
      "idea": "Siri for Voice-Controlled Photo Editing",
      "description": "An app that allows users to apply photo edits and effects using voice commands, making the editing process more accessible.",
      "segment": "Photo Editing Mobile Apps"
    }`,
    MARKET_SIZE: `Objective: Generate a unique and innovative software business idea to solve the user problem in the input. An associated activity may also be included in the input before the problem to provide context. Prioritize generating truly unique and innovative ideas.
    The idea must correlate to one of the following market segments. Choose the segment that is closest to the user input from the list below:
    Sports Analytics Software
    Fitness and Training Apps
    Sports Streaming and Media Platforms
    Fantasy Sports Platforms
    Sports Event Ticketing Software
    Music Streaming Services
    Music Production Software
    AI Music Composition Tools
    Mobile Gaming Apps
    Virtual Reality Gaming
    Blockchain Gaming Platforms
    Cloud Gaming Services
    Stock Trading Platforms
    Robo-Advisors
    Cryptocurrency Exchanges
    P2P Lending Platforms
    Insurance Tech Platforms
    Social Media Platforms
    Messaging Apps
    Virtual Reality Social Platforms
    Cycling Apps
    Online Travel Agencies
    Car Rental Apps
    Fashion E-commerce Platforms
    Fashion Resale and Secondhand Platforms
    Subscription Box Services
    Video Streaming Services
    Video on Demand (VOD) Services
    Meal Kit Delivery Services
    Grocery Delivery Services
    Food Delivery Apps
    Online Learning Platforms
    Educational Apps and Game Platforms
    Language Learning Software
    Virtual Classroom Platforms
    Corporate Training Software
    E-books and Digital Libraries
    Learning Management Systems (LMS)
    Do not generate or use any market segments that are not included in this list.
    
    The idea will always be a software solution, not a physical product. The idea will focus on a specific niche and include one key differentiating feature that sets it apart from existing solutions for each. The idea should be groundbreaking, applying a novel approach not seen in the industry before. Consider the following aspects when crafting this idea:
    Offer a scalable solution that can be easily replicated and deployed across multiple markets or geographies.
    Demonstrate strong network effects, where the value of the product or service increases as more users adopt it.
    Leverage cutting-edge technologies (e.g., AI, blockchain, IoT) to create a significant competitive advantage or barrier to entry.
    Disrupt traditional industries by introducing a dramatically more efficient, convenient, or cost-effective alternative.
    Create a new market or category by offering a unique value proposition that addresses previously unrecognized needs.
    Address a price-insensitive problem that consumers already pay money to solve, ensuring strong demand and revenue potential.
    Involves a fully automated, technology-driven solution that can create value for millions of users without requiring manual or human intervention, ensuring exceptional scalability.
    
    Describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. Also provide the market segment you chose the idea from in a separate line below the idea. Do not use any market segments that are not on the list.
    
    Lastly, generate a catchy "X for Y" analogy for the business idea in 6 words or less. The analogy should concisely convey the core concept by comparing it to a well-known successful company or product (X) being applied to a new domain or market (Y). Aim to highlight the unique value proposition. This will precede the business idea on its own line.
    
    After generating the idea, double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, revise your selection to use a segment from the list that best fits the generated idea.
    Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input:
    Jobs/Careers. Preparing for a career switch
    Output:
    {
      "idea": "Roblox for Career Exploration",
      "description": "A mobile app that allows users to virtually explore careers, learn required skills, complete simulated tasks, and build a professional portfolio.",
      "segment": "Educational Apps and Game Platforms"
    }
    Input:
    Sports/Fitness. Finding available exercise equipment at the gym
    Output:
    {
      "idea": "OpenTable for Smart Gym Equipment Bookings",
      "description": "An app that integrates with gym equipment to reserve machines and optimize workout plans based on real-time availability and user goals.",
      "segment": "Fitness and Training Apps"
    }
    Input:
    Finding music to pair with edited videos or other content
    Output:
    {
      "idea": "Spotify for Storytelling",
      "description": "A platform that generates dynamic soundtracks for stories and narratives, with AI adapting the music to fit the plot twists, character emotions, and scenes.",
      "segment": "AI Music Composition Tools"
    }
    Input:
    Gaming. Lack of true ownership in gaming
    Output:
    {
      "idea": "Minecraft for Blockchain",
      "description": "A sandbox game where players can build, own, and trade virtual lands and assets using blockchain, with in-game items having real-world value through NFTs.",
      "segment": "Blockchain Gaming Platforms"
    }
    Input:
    Finance/Investing. Creating a balanced and diversified investment portfolio
    Output:
    {
      "idea": "Hedgeye for AI-Driven Hedging Strategies",
      "description": "A platform that uses AI to develop and execute hedging strategies, protecting portfolios from downside risk.",
      "segment": "Stock Trading Platforms"
    }`,
    COMPLEXITY: `Objective: Generate a unique and innovative software business idea to solve the user problem in the input. An associated activity may also be included in the input before the problem to provide context. Prioritize generating truly unique and innovative ideas.
    The idea must correlate to one of the following market segments. Choose the segment that is closest to the user input from the list below:
    Photo Editing Software
    Graphic Design Software
    Online Art Marketplaces
    Art Education Platforms
    Stock Photography Platforms
    Digital Art and Portfolio Platforms
    Photo Editing Mobile Apps
    Digital Painting Software
    Photo Book Creation Software
    Sports Management Software
    Fitness and Training Apps
    Fan Engagement and Loyalty Platforms
    Music Learning Apps
    DJ Software
    Cycling Apps
    Fishing Apps
    Tour Planning Software
    Travel Blogging Platforms
    Travel Journal and Itinerary Apps
    Custom Tailoring Apps
    Subtitle and Dubbing Software
    Recipe Apps
    Food Blogging Platforms
    Food Waste Reduction Apps
    Food Allergy Management Apps
    Couple Goal Tracking Platforms
    Virtual Date Ideas Apps
    Couples' Communication Apps
    Gifting Apps
    Online Proposal Planning Services
    Test Preparation Apps
    Do not generate or use any market segments that are not included in this list.
    
    The idea will always be a software solution, not a physical product. The idea will focus on a specific niche and include one key differentiating feature that sets it apart from existing solutions for each. The idea should be groundbreaking, applying a novel approach not seen in the industry before. Consider the following aspects when crafting this idea:
    Leverage existing platforms and APIs: The business idea should utilize well-established platforms and APIs, reducing the need for custom development and minimizing technical complexity.
    Simple, focused functionality: The core functionality of the software should be simple, intuitive, and focused on solving a specific problem, reducing the scope of development required.
    Focus on niche markets: Target specific, underserved niches where competition is lower, and it's easier to gain traction with minimal resources.
    Minimize need for unique or complex data: The business idea should rely primarily on easily accessible, widely available, or user-generated data, rather than requiring the collection or processing of unique or complex data sets.
    
    Describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. Also provide the market segment you chose the idea from in a separate line below the idea. Do not use any market segments that are not on the list.
    
    Lastly, generate a catchy "X for Y" analogy for the business idea in 6 words or less. The analogy should concisely convey the core concept by comparing it to a well-known successful company or product (X) being applied to a new domain or market (Y). Aim to highlight the unique value proposition. This will precede the business idea on its own line.
    
    After generating the idea, double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, revise your selection to use a segment from the list that best fits the generated idea.
    Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Music. Developing songwriting skills
    Output:
    {
      "idea": "Grammarly for Songwriting",
      "description": "An app that provides songwriting prompts, tools, and feedback, helping users develop their songwriting abilities and create original music.",
      "segment": "Music Learning Apps"
    } 
    Input: 
    Mental Health. Finding moments of relaxation
    Output:
    {
      "idea": "Calm for Photo Therapy",
      "description": "A mobile app that combines mindfulness exercises with photo editing tasks to promote relaxation, creativity, and mental well-being.",
      "segment": "Photo Editing Mobile Apps"
    } 
    Input: 
    Staying in touch with friends virtually
    Output:
    {
      "idea": "WhatsApp for Automated Photo Book Sharing",
      "description": "An app that automatically creates and shares photo book memories with friends and family via group texts on special occasions and anniversaries.",
      "segment": "Photo Book Creation Software"
    } 
    Input: 
    Sports/Fitness. Fitting workouts into a busy daily routine
    Output:
    {
      "idea": "HIIT for Micro-Workouts",
      "description": "An app offering 5-10 minute micro-workouts tailored to specific fitness goals and schedules, fitting seamlessly into daily routines.",
      "segment": "Fitness and Training Apps"
    } 
    Input: 
    Watching Sports. Staying engaged during live sporting events
    Output:
    {
      "idea": "Twitter for Real-Time Fan Polls",
      "description": "An app that conducts real-time polls during games and events, allowing fans to vote on various aspects like player of the match, game strategies, and more.",
      "segment": "Fan Engagement and Loyalty Platforms"
    }`,
  }, // provide System Prompt for Content Brand when available

  SYSTEM_IDEA_VALIDATION: `Step 1: The assistant will make minor language modifications to the user input without losing any content or context. It will ensure the business idea sounds professional and well-articulated. The description will always be 140 characters or less.
  Step 2: The assistant will examine the idea and identify it as either:
  A software business idea, or
  A physical product business idea
  Step 3A: If it identifies it as a software business idea, it will map the idea to one of the following market segments based on its closest fit:
  Photo Editing Software
  Graphic Design Software
  Online Art Marketplaces
  Art Education Platforms
  Stock Photography Platforms
  Digital Art and Portfolio Platforms
  Photo Sharing Apps
  3D Modeling Software
  Photo Editing Mobile Apps
  Digital Painting Software
  Photo Book Creation Software
  Sports Management Software
  Athlete Performance Tracking Software
  Sports Analytics Software
  Fitness and Training Apps
  Sports Streaming and Media Platforms
  Fantasy Sports Platforms
  Sports Betting Software
  Fan Engagement and Loyalty Platforms
  Sports Event Ticketing Software
  Music Streaming Services
  Music Production Software
  Music Publishing and Royalty Management Platforms
  Online Music Marketplaces
  Music Learning Apps
  Concert Services & Livestreaming
  Music Collaboration Tools
  AI Music Composition Tools
  DJ Software
  Mobile Gaming Apps
  Game Development Software
  E-sports Platforms
  Game Streaming Services
  Virtual Reality Gaming
  Online Multiplayer Games
  Blockchain Gaming Platforms
  Cloud Gaming Services
  Stock Trading Platforms
  Robo-Advisors
  Personal Finance Software
  Cryptocurrency Exchanges
  P2P Lending Platforms
  Wealth Management Software
  Financial News and Investment Analysis Platforms
  Tax Preparation Software
  Insurance Tech Platforms
  Budgeting Apps
  Social Media Platforms
  Group Activity Planning Apps
  Messaging Apps
  Event Planning Services
  Professional Networking Sites
  Virtual Reality Social Platforms
  Adventure Travel Apps
  Cycling Apps
  Fishing Apps
  Hiking and Trail Apps
  Outdoor Fitness Apps
  Wildlife Tracking Apps
  Gear Rental Platforms
  Online Travel Agencies
  Travel Booking Apps
  Virtual Tour and Local Guide Platforms
  Flight and Hotel Comparison Sites
  Travel Insurance Platforms
  Car Rental Apps
  Tour Planning Software
  Travel Blogging Platforms
  Travel Journal and Itinerary Apps
  Fashion E-commerce Platforms
  Virtual Try-On Apps
  Sustainable Fashion Platforms
  Fashion Resale and Secondhand Platforms
  Fashion Design Software
  Subscription Box Services
  Custom Tailoring Apps
  Fashion Trend Analysis Software
  Personal Styling Apps
  Video Streaming Services
  Online Ticket Booking Platforms
  Video on Demand (VOD) Services
  Film Production Software
  Animation and VFX Software
  Online Film Festivals
  Movie/TV Show Recommendation Platforms
  VR Film Experiences
  AI Script Writing Tools
  Subtitle and Dubbing Software
  Streaming Service Aggregators
  Meal Kit Delivery Services
  Recipe Apps
  Grocery Delivery Services
  Food Blogging Platforms
  Nutrition Tracking Apps
  Online Cooking Classes and Platforms
  Restaurant Reservation Apps
  Food Waste Reduction Apps
  Food Delivery Apps
  Food Allergy Management Apps
  Online Dating Services
  Dating Apps
  Couple Goal Tracking Platforms
  Matchmaking Apps
  Virtual Date Ideas Apps
  Couples' Communication Apps
  Romantic Getaway Booking Apps
  Relationship Counseling Apps
  Gifting Apps
  Online Proposal Planning Services
  Online Learning Platforms
  Educational Apps and Game Platforms
  Language Learning Software
  Virtual Classroom Platforms
  Online Tutoring Services
  Test Preparation Apps
  Corporate Training Software
  E-books and Digital Libraries
  Learning Management Systems (LMS)
  Skill Assessment Tools
  Virtual Field Trip Platforms
  It will never generate or use any market segments that are not included in this list.
  Step 4A: The assistant will describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. It will also provide the market segment chosen from the list in a separate line below the idea.
  Step 5A: Lastly, the assistant will generate a catchy "X for Y" analogy for the business idea in 6 words or less. The analogy should concisely convey the core concept by comparing it to a well-known successful company or product (X) being applied to a new domain or market (Y), highlighting the unique value proposition. OR if differentiating based on distribution model or format, the analogy can state a product or company well known for the same value proposition and add the unique distribution model/format. This will precede the business idea on its own line.
  Step 3B: If it identifies it as a physical product business idea, it will map the idea to one of the following market segments based on its closest fit:
  Drawing Supplies
  Painting Supplies
  Canvas and Paper
  Cameras and Lenses
  Photography Accessories
  Lighting and Studio Equipment
  Writing Instruments
  Notebooks and Journals
  Calligraphy Sets
  Art Supplies
  Golf Equipment
  Tennis Equipment
  Pickleball Equipment
  Golf Apparel
  Skis and Snowboards
  Ski and Snowboard Apparel
  Ski & Snowboard Accessories
  Team Sports Equipment
  Protective Gear
  Team Apparel
  Training Equipment
  Swimwear
  Swim Accessories
  Swim Training Gear
  Pool Equipment
  Festival Gear
  Concert Merchandise
  Festival Apparel
  Portable Food & Drink
  Audio Equipment
  Home Audio Systems
  Portable Audio
  Musical Instruments
  Recording Equipment
  Music Production Gear
  DJ Equipment
  Music Merchandise
  Fan Apparel
  Concert Accessories
  Posters and Prints
  VR Headsets
  VR Accessories
  Gaming Consoles
  PC Gaming Hardware
  Gaming Accessories
  Coin Collecting Supplies
  Precious Metal Coins
  Currency Collecting
  Coin Grading Services
  Autographed Merchandise
  Memorabilia Display Cases
  Replica Trophies
  Vintage Sports Memorabilia
  Action Figures
  Trading Cards
  Board Games
  Educational Toys
  Antique Furniture
  Historical Documents
  Vintage Watches
  Rare Books
  Board Games
  Outdoor Gear
  Portable Food & Drink
  Picnic Supplies
  Party Supplies
  Group Games
  Outdoor Furniture
  BBQ Equipment
  Holiday Decorations
  Gift Items
  Baking Supplies
  Beverages
  Party Games
  Camping Gear
  Hiking Gear
  Camping Food
  Navigation Equipment
  Bicycles
  Cycling Gear
  Bike Accessories
  Electric Bikes
  Fishing Gear
  Fishing Apparel
  Fishing Boats
  Fishing Accessories
  Water Sports Equipment
  Swimwear and Accessories
  Inflatable Water Toys
  Boating Gear
  Travel Accessories
  Leisure Products
  Beach Gear
  Spa Products
  Outdoor Gear
  Adventure Equipment
  Team Building Kits
  Travel Gear
  Guidebooks and Maps
  Gourmet Foods
  Cooking Classes
  Food Tours
  Luxury Clothing
  Luxury Accessories
  High-End Shoes
  Luxury Outerwear
  Athletic Shoes
  Designer Shoes
  Casual Shoes
  Outdoor Shoes
  Fast Fashion
  High-End Fashion
  Sustainable Fashion
  Streetwear
  Athleisure Clothing
  Athleisure Footwear
  Yoga Gear
  Fitness Accessories
  Running Shoes
  Running Apparel
  Running Accessories
  Nutrition for Runners
  Weightlifting Equipment
  Weightlifting Apparel
  Supplements
  Home Gym Equipment
  Fitness Equipment
  Fitness Apparel
  Yoga Gear
  Supplements
  Home Gym Equipment
  Exercise Accessories
  Fitness Apparel
  Fitness Tracking
  Bar Tools and Accessories
  Spirits and Liquors
  Mixers and Syrups
  Cocktail Kits
  Kitchen Appliances
  Cookware and Bakeware
  Knives and Cutting Tools
  Specialty Ingredients
  Baking Tools and Accessories
  Ingredients for Baking
  Baking Mixes
  Decorating Supplies
  Health Foods
  Fitness Supplements
  Vitamins & Minerals
  Hair Care Products
  Styling Tools
  Professional Hair Care
  Hair Color
  Nail Products
  Nail Care & Art
  Skincare Products
  Luxury Skincare
  Natural Skincare
  Acne Treatment
  Makeup Products
  Luxury Makeup
  Professional Makeup
  Organic Makeup
  Dog Food
  Dog Toys
  Dog Accessories
  Dog Health
  Cat Food
  Cat Toys
  Cat Accessories
  Cat Health
  Small Animal Supplies
  Fish and Aquarium Supplies
  Bird Supplies
  Reptile Supplies
  Binoculars and Scopes
  Bird Watching Supplies
  Wildlife Cameras
  Outdoor Gear
  Meditation Cushions
  Aromatherapy
  Mindfulness Journals
  Sleep Aids
  Mattresses
  Sleep Accessories
  Aromatherapy for Sleep
  Gardening Tools
  Outdoor Furniture
  Nature Journals
  Plant Care Products
  Essential Oils
  Diffusers
  Aromatherapy Accessories
  Natural Remedies
  It will never generate or use any market segments that are not included in this list.
  Step 4B: The assistant will describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. It will also provide the market segment chosen from the list in a separate line below the idea.
  Step 5B: Lastly, the assistant will generate a short description for the business idea in 5 words or less. This description should generate curiosity while clearly describing the business idea. This will precede the business idea on its own line.
  Final Check: After generating the idea, the assistant will double-check that the selected market segment is from the list provided at the beginning of this section. If the market segment is not on the list, the assistant will revise the selection to use a segment from the list that best fits the generated idea.
  Also, ensure that your response should only contain three things that is business idea, business description and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
  You should also ensure that the respone should be an strictly be an object having 'idea' key containg the generated catchy short description, 'description' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
  You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'idea', 'description' and 'segment'. Nothing else will be considered a valid response.
  To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
  Example Outputs
  Input: a smart bird feeder with a built in camera for noise conscious, remote bird watching 
  Output:
  {
      "idea": "Smart Bird Feeder",
      "description": "Noise-cancelling bird feeder with built-in camera for remote bird watching and conservation.",
      "segment": "Bird Watching Supplies",
      "type": "product"
  }
  Input: ai integrated tennis racket that provides real swing analysis and coaching suggestions for improvement. 
  Output:
  {
      "idea": "AI Tennis Coach Racket",
      "description": "AI-powered tennis racket with real-time swing analysis and personalized coaching for skill improvement.",
      "segment": "Tennis Equipment",
      "type": "product"
  }
  Input: beach umbrella with built in anchoring system and a solar powered phone charger 
  Output:
  {
      "idea": "Solar-charging beach umbrella",
      "description": "Customizable, modular beach umbrella with built-in sand anchors and solar-powered phone charger.",
      "segment": "Beach Gear",
      "type": "product"
  }
  Input: coin collecting sets with themed packaging and rarity levels similar to trading card packs. 
  Output:
  {
      "idea": "Collectible mystery coin sets",
      "description": "Collectible, mystery coin sets with themed packaging and varying rarity levels for exciting, accessible collecting.",
      "segment": "Coin Collecting Supplies",
      "type": "product"
  }
  Input: smart plant care system where ai optimizes watering and lighting for plant growth 
  Output:
  {
      "idea": "Smart Plant Care System",
      "description": "Smart plant care system with AI-driven watering, lighting, and nutrient dosing for optimal plant health and growth.",
      "segment": "Plant Care Products",
      "type": "product"
  }
  Input: workout app focused on 5 minute workouts that fit into your daily life. 
  Output:
  {
      "idea": "5-Minute P90X Mobile App",
      "description": "An app offering 5-10 minute micro-workouts tailored to specific fitness goals and schedules, fitting seamlessly into daily routines.",
      "segment": "Fitness and Training Apps",
      "type": "software"
  }
  Input: a live voting app where fans get to influence real game decisions and nominate players of the game. 
  Output:
  {
      "idea": "Twitter for Real-Time Fan Polls",
      "description": "An app that conducts real-time polls during games and events, allowing fans to vote on various aspects like player of the match, game strategies, and more.",
      "segment": "Fan Engagement and Loyalty Platforms",
      "type": "software"
  }
  Input: an app that send pictures of moments and memories to a group chat of friends for birthdays, event anniversaries, etc. 
  Output:
  {
      "idea": "Instagram on SMS",
      "description": "An app that automatically creates and shares photo book memories with friends and family via group texts on special occasions and anniversaries.",
      "segment": "Photo Book Creation Software",
      "type": "software"
  }
  Input: an app that helps songwriters create and get feedback on their work using AI 
  Output:
  {
      "idea": "Grammarly for Songwriting",
      "description": "An app that provides songwriting prompts, tools, and feedback, helping users develop their songwriting abilities and create original music.",
      "segment": "Music Learning Apps",
      "type": "software"
  }
  Input: platform that allows parents to upload a sample of their voice and picture that AI turns into a child youtube video, so it feels like they are the star of the video and teaching their own children. 
  Output: 
  {
      "idea": "JibJab for Educational Kids' Music Videos",
      "description": "Parents upload a voice recording and picture to create educational music videos, like popular YouTube kids' channels, featuring them as the performer.",
      "segment": "Music Learning Apps",
      "type": "software"
  }`,
};

export const SYSTEM_IDEA_GENERATOR = {
  PROBLEM_MARKET_SELECTOR: `Objective: To match a user input, which is always a business concept or idea, to a problem and a market segment from a specific list. The assistant should ensure the chosen problem and market segment are the closest and most relevant to the given business concept or idea.

  Instructions:
  Input:
  Receive a business concept or idea from the user.
  
  Matching Process:
  Problem Matching:
  Please select a problem from this list that is closest to the user input:
  Cryptocurrency markets are highly volatile and risky
  Accessible education in remote areas is limited
  City parking is expensive and limited in availability
  Education for incarcerated individuals is often limited
  Millennials prefer subscription-based car ownership
  Tailoring clothes for a perfect fit is expensive and time-consuming
  Electric and eco-friendly cars are expensive for consumers
  Frequent doctor visits for chronic issues are inconvenient
  High-demand sports tickets sell out quickly
  Busy professionals seek quick, healthy meal solutions
  Social media often leads to shallow relationships
  Job training for underserved youth is often limited
  Screening for rare diseases is expensive and limited
  Finding reliable and vetted home repair professionals is challenging
  Engaging remote event attendees is challenging
  Accessible transportation in rural areas is limited
  Busy parents want on-demand childcare services
  One-size-fits-all education fails to meet individual needs
  Sports streaming packages are expensive for viewers
  Cryptocurrency exchanges lack robust security measures
  Accessible mental health support is often limited
  Mental health support for seniors is often limited
  Coordinating care for elderly relatives across family members is difficult
  Remote workers seek flexible co-working space rentals
  Difficult to find eco-friendly products for kids
  Limited plus-size options in sustainable fashion
  Finding reliable and vetted personal fitness trainers is challenging
  Gen Alpha expects gamified educational content
  Limited sustainable options for baby products
  Managing digital assets and passwords after death is complex
  Online classes can be disengaging for many students
  Dating platforms often enable harassment of users
  Finding size-inclusive clothing rental options is limited
  Freelancers need project-based health insurance options
  Purebred dogs are expensive to purchase and maintain
  Outdoor enthusiasts seek sustainable gear options
  Online therapy lacks the human connection of in-person sessions
  Finding reliable and vetted home organizers is time-consuming
  Finding reliable and vetted tutors for specific subjects is time-consuming
  Finding ethical and sustainable fashion options is time-consuming
  Limited mental health resources for minority groups
  Working parents need flexible, on-demand pet care services
  Coordinating shared childcare for non-traditional work schedules is difficult
  Finding reliable and vetted elder care services is challenging
  Parents want kid-safe social media platforms
  Professional-grade cameras are costly for hobbyists
  Wearable devices often have short battery life
  Access to healthcare in rural areas is limited
  Buildings often have high energy consumption rates
  Limited fashion options for plus-size teens
  Limited sustainable menstrual product options
  Finding reliable and vetted personal financial advisors is time-consuming
  Managing personal digital content creation and monetization is disorganized
  Communication with remote teams can be ineffective
  Manual invoice processing is prone to errors
  Interpreting personal health data is often confusing
  Unexpected appliance breakdowns are costly and inconvenient
  Gen Z expects instant, mobile-first customer service
  Gen-Z consumers prefer video content over pictures or text
  Customizing meal plans for specific health conditions is complex
  Limited culturally diverse skin care products
  Managing personal education and skill development plans is disorganized
  Cryptocurrency and DeFi platforms are confusing for newcomers
  Reselling used textbooks is often difficult
  Gen Z prefers mobile-first insurance solutions
  Non-English speakers lack localized streaming content
  Electric cars have limited battery range for long trips
  Busy professionals want on-demand home cleaning
  Coordinating multi-family childcare arrangements is complex
  Energy management in low-income homes is challenging
  Sitting in traffic wastes valuable time
  Continuing education while working full-time is challenging
  Energy management in homes is frequently inefficient
  Coordinating group travel for people with diverse needs is complex
  Gig workers need flexible financial planning tools
  Edtech raises concerns about student data privacy protection
  Low-income areas lack access to fresh produce delivery
  Minimalists seek multi-functional home goods
  Tech-averse seniors need simplified telehealth services
  Concert ticket sites charge excessive processing fees
  Plus-size and inclusive sizing options are limited in fashion
  Clean energy access in off-grid areas is limited
  Dating apps are populated with fake or inactive profiles
  Learning new skills often lacks motivation for self-learners
  Non-tech-savvy users struggle with smart home devices
  Virtual reality gaming equipment is expensive
  Creating custom travel itineraries is time-intensive
  Working mothers need flexible fitness class schedules
  Low-income families lack affordable tutoring services
  Managing personal genetic data and health insights is overwhelming
  Rural areas have limited access to grocery delivery
  Limited fashion options for gender non-conforming individuals
  Business learning tools often lack personalization for users
  Comparing insurance options is confusing for many consumers
  Compatibility between smart home equipment is often limited
  Smart homes raise privacy and security concerns
  Working from home can lead to loneliness and burnout
  Managing personal energy usage and efficiency is cumbersome
  Managing personal legal document archives is disorganized
  Students seek affordable textbook rental options
  Gen Z expects augmented reality shopping experiences
  Non-drivers seek better last-mile transportation solutions
  Organizing and digitizing old family photos is tedious
  Personalizing language learning to individual goals is difficult
  Finding suitable part-time work is challenging
  Cybersecurity threats are increasing in frequency and complexity
  Old buildings have high energy costs for occupants
  Remote work collaboration is challenging for many teams
  Cheating and hacking ruins online gaming experiences
  Data privacy compliance is complex and challenging for companies
  Sensitive data is vulnerable to theft by hackers
  Immigrants struggle to access credit-building services
  Managing personal collections of digital memories and life events is overwhelming
  Mental health support for LGBTQ+ individuals is often limited
  Finding reliable and vetted personal stylists is difficult
  Building trust and deep connections in online communities is difficult
  Managing multiple passwords securely is frustrating for users
  Professional certifications are often prohibitively expensive
  Skiing and snowboarding gear is expensive for casual users
  Mental health support for new mothers is often limited
  LGBTQ+ community seeks inclusive dating apps
  Tracking home maintenance schedules is often overlooked
  Internet connectivity is limited in many rural areas
  Lead generation is often ineffective for many businesses
  Finding reliable and vetted personal chefs for dietary needs is challenging
  Choosing outfits daily is time-consuming
  Managing personal finances is overwhelming for many people
  Energy storage for renewable sources is often inefficient
  Home workout equipment is costly for beginners
  Taking phone calls in noisy places is challenging
  Wedding planning is often stressful and overwhelming
  Carrying multiple payment and loyalty cards is cumbersome
  Tech-savvy seniors seek age-appropriate social platforms
  Coordinating shared ownership and maintenance of community spaces is complex
  Ineffective methods for protecting against in-game cheating and hacks
  High-end smart home devices are prohibitively expensive
  Investment and trading platforms often charge high fees
  Customer data is often fragmented across multiple systems
  Overcoming public speaking anxiety is challenging for many
  Football raises long-term safety and health concerns
  Business intelligence is often fragmented across multiple tools
  Online meditation classes often lack the ambiance of in-person sessions
  Coordinating neighborhood renewable energy initiatives is complex
  Finding culturally appropriate etiquette advice for travelers is difficult
  Quality specialty shoes are expensive for consumers
  Payroll processing is error-prone and time-consuming
  Quality camping gear is expensive for casual campers
  Social media platforms lack robust privacy controls
  Device batteries degrade significantly over time
  Gauging compatibility from online profiles is challenging
  Textbooks are heavy and quickly become outdated
  Air pollution monitoring in cities is often inadequate
  Telemedicine apps can be challenging for seniors to use
  Supply chain visibility is limited for many businesses
  Organizing community sports leagues is administratively burdensome
  Project management often lacks visibility for stakeholders
  Conflicting healthy eating information abounds online
  Controlling multiple smart home devices is complex
  In-game purchases create unfair advantages for players
  Online gaming communities can be toxic for newcomers
  Locating charged micromobility vehicles can be difficult
  Medication effectiveness varies widely between individuals
  Marketing ROI is difficult to measure accurately
  Finding short-term workspace in unfamiliar cities is time-consuming
  Limited adaptive sportswear options for disabled athletes
  Neurodiverse children need adapted learning apps
  Legal services are expensive and intimidating
  Coordinating shared ownership of vacation properties is complex
  Finding reliable and vetted home stagers for real estate is time-consuming
  Non-English speakers need localized financial literacy tools
  Retirees struggle to find part-time job opportunities
  Finding age-appropriate volunteer opportunities for kids is challenging
  Seniors struggle with digital-only banking services
  Challenges in accessing mental health support and therapy
  Customer support is frequently slow and inefficient
  Healthcare access for migrant workers is often limited
  Blockchain technology is difficult for laypeople to understand
  Effective time management is challenging for many individuals
  Professional video equipment is cost-prohibitive
  High-quality drawing tablets are prohibitively expensive
  Visualizing furniture placement before purchasing is difficult
  Niche professional education topics have limited resources
  Understanding sports betting complexities
  Video editing software has a steep learning curve
  Vegans struggle to find suitable meal kit options
  Comparing moving company prices is time-consuming
  Difficult to find teen-friendly banking products and services
  Older generations struggle with cryptocurrency platforms
  Quality backpacking and camping gear is expensive
  Employee engagement is low in many workplaces
  Quality educational tools are expensive for schools
  Cameras are often bulky and prone to damage
  Estate planning is complex and often neglected by individuals
  Managing family medical history across generations is disorganized
  Travelers with disabilities lack accessible booking options
  Finding specific information in user manuals is time-consuming
  PTSD support for veterans is often inaccessible
  Coordinating group gift-giving for special occasions is cumbersome
  Supply chains often lack transparency for consumers
  Clean energy access in developing nations is limited
  Financial services for unbanked populations are limited
  Organizing digital files efficiently is challenging for many users
  Conducting genealogy research is time-consuming and complex
  Tracking and improving sleep patterns is challenging for many
  IT support is frequently overwhelmed in many organizations
  Dating apps lack specific filters for compatibility
  Finding licensed CBT therapists can be challenging
  Gen X prefers desktop-based productivity tools
  Managing multiple rental properties is administratively burdensome
  Parking meter payment options are often restricted
  Navigating busy stadiums and parking lots is frustrating
  High-end skincare products are expensive for consumers
  Live sports event tickets are expensive for fans
  Golf equipment is prohibitively expensive for beginners
  Achieving complex hairstyles often requires a professional
  Professional animal training services are expensive
  Premium personal branding tools have limited availability
  Talent retention is challenging for many organizations
  Finding reliable pet sitters for exotic pets is challenging
  Tracking personal carbon emissions is cumbersome
  Supply chain issues frequently cause product shortages
  Screen time raises concerns for child development
  Multiple streaming subscriptions become expensive
  Trendy clothes often sacrifice quality for affordability
  Premium running smartwatches are expensive
  Audio quality often suffers on music streaming platforms
  Finding reliable home service providers is often challenging
  Internal communication is often disjointed in organizations
  Sports betting often distracts from the enjoyment of game viewing
  Coordinating carpools for kids' activities is logistically challenging
  Organizing neighborhood watch programs is logistically challenging
  Non-native speakers struggle with voice assistants
  Organ transplant waitlists are often extremely long
  Healthcare access in conflict zones is often limited
  Ocean plastic pollution monitoring is often inadequate
  Finding reliable information on health symptoms is often difficult
  Football equipment is expensive for casual players
  Finding age-appropriate activities for kids is challenging for parents
  Dating sites lack nuanced compatibility filtering options
  Popular ski resorts often become overcrowded
  Securely transferring or reselling tickets is challenging
  Gauging compatibility through online dating is challenging
  Handwritten notes are easily lost or damaged
  Budgeting without professional advice can be challenging
  Virtual personal styling services often feel impersonal
  Exotic pets and their habitats are very expensive
  Managing personal art collections and provenance is challenging
  Coordinating care for elderly family members is challenging
  Online tutoring often lacks personalization for students
  Introverts prefer text-based customer support
  Coordinating shared ownership of expensive equipment is complex
  Greenhouse gas emissions monitoring is often inadequate
  Organizing and cataloging personal book collections is tedious
  Water usage in agriculture is frequently inefficient
  Losing keys is costly and inconvenient
  Finding reliable product reviews is challenging for consumers
  Sales pipeline management is often manual and inefficient
  Trying on clothes in stores is inconvenient
  Online friendships often focus too much on popularity metrics
  Sports live streams often buffer or lag during peak times
  Hunting gear is prohibitively expensive for newcomers
  Meal planning is time-consuming for busy individuals
  Travel booking sites often have hidden fees
  Tracking health metrics can be cumbersome for individuals
  Household energy costs are high in many areas
  Neurodivergent individuals need adapted job boards
  Urban traffic congestion management is challenging
  Agricultural water usage management is frequently inefficient
  Learning to create digital art has a steep learning curve
  Rock climbing equipment is expensive for beginners
  Working from home often leads to procrastination and distractions
  Regional blackouts restrict access to sports streams
  Online forums can enable unhealthy coping post-breakup
  Industry compliance is overwhelming for many businesses
  Managing personal collections of digital creative works is disorganized
  Managing personal wine collections and tasting notes is disorganized
  Night shift workers lack suitable food delivery options
  Limited resources for improving gaming skills and strategies
  Gene therapy treatments are rare and prohibitively expensive
  Waste management in cities is frequently inefficient
  Limited resources for learning to play musical instruments online
  Water quality monitoring systems are often inadequate
  Navigating complex financial regulations is challenging
  Energy management in manufacturing is challenging
  Forest fire detection systems are often inadequate
  Last-mile delivery in cities is often inefficient
  Energy management in commercial buildings is challenging
  ID verification processes are time-consuming and intrusive
  Special needs resources are limited for families
  Professional music production software is expensive
  Building a consistent networking habit is challenging
  Product packaging often creates excessive waste
  Recycling of electronic waste is frequently inefficient
  Organ transplant recipients risk rejection complications
  Finding local events and activities can be difficult in some areas
  Fostering deeper connections between fans and teams is challenging
  Self-help gurus often peddle pseudoscience to followers
  Education access for refugees is often limited
  Long-term value of electric cars is uncertain for buyers
  Product development processes are often slow and inefficient
  Real-time market data often requires paid subscriptions
  Long lines at sports events detract from the experience
  Finding reliable vacation rental reviews is difficult
  Finding cheap, comfortable home office equipment is difficult
  Comparing travel prices across platforms is time-consuming
  Professional makeup tools are expensive for beginners
  Constant monitoring is needed while cooking
  Ensuring kids meet nutrition guidelines is challenging
  Planning unique and creative dates is challenging
  Discovering new podcasts and audiobooks is time-consuming
  Some eco-friendly products lack long-term durability
  Managing multiple subscriptions is time-consuming
  Lost and found systems are often inefficient
  Maintaining consistent mindfulness practice is challenging
  Package shipping often experiences delays and mistakes
  Online language learning lacks true immersion experiences
  Wildfire smoke pollution monitoring is often inadequate
  Monitoring of industrial emissions is often inadequate
  Air quality monitoring in schools is often inadequate
  Online shoe sizing information is frequently inaccurate
  Comparing insurance options is complex and time-consuming
  Finding high-quality public speaking techniques is difficult
  Coordinating attendee schedules for events is challenging
  Comparing college options is daunting for prospective students
  Arranging pet sitting services is often challenging for pet owners
  Language barriers complicate international travel
  Limited access to personalized tutoring for complex subjects
  Eco-friendly home upgrades are often expensive
  Coupon clipping is tedious and time-consuming
  Difficulty in receiving tailored nutritional advice and meal plans
  Employee onboarding processes are often time-consuming for companies
  Limited resources for reducing personal carbon footprint
  Paper receipts are easily lost or damaged
  Affordable housing in urban slums is scarce
  Conflicting information on healthy eating found online
  Language barriers complicate independent trip planning
  Limited cloud storage for high-resolution video files
  Few tools exist to track child behavior patterns
  Customer feedback is poorly managed in many organizations
  Excessive product placement disrupts reality TV viewing
  Sports streams lack personalization options for viewers
  Purebred cats often have breed-specific health issues
  Mindfulness apps and courses are often expensive
  Public soccer fields are limited in many areas
  Coordinating community garden plots and harvests is logistically challenging
  Cancelling subscriptions is often unnecessarily complicated
  Select the problem that is most closely related to the business concept or idea.
  
  Market Segment Matching:
  Please select a market segment from the following list that is closest to the user input:
  AI-powered Predictive Maintenance
  Educational Apps and Games
  Grocery Delivery Services
  AI Music Composition Tools
  Home Office Equipment E-Comm
  Remote Patient Monitoring & Wearable Integration
  Car Rental Apps
  Fashion E-commerce Platforms
  Digital Payments Software
  Social Media Platforms
  Micromobility Data Analytics & Insights
  Mobile Gaming Apps
  Corporate Training Software
  Auto Parts & Accessories E-commerce
  Telemedicine Practice Mgmt & EHR Systems
  Test Preparation Apps
  Fantasy Sports Platforms
  Solar Panel & Renewable Energy Markets
  Collectibles Authentication & Valuation
  AI Legal Technology
  Music Streaming Services
  Language Learning Software
  Sports Analytics Software
  P2P Lending Platforms
  Cycling Apps
  Personalized Learning Path & Recommendation Engines
  AI Script Writing Tools
  Sports Event Ticketing Software
  Stock Trading Platforms
  Virtual Reality Social Platforms
  Cloud Gaming Services
  E-books and Digital Libraries
  Video Streaming Services
  Gamified Employee Engagement & Performance Mgmt
  Sports Betting Software
  Online Ticket Booking Platforms
  Video on Demand (VOD) Services
  Custom Tailoring Apps
  Online Tutoring Services
  AI-powered Personalized Drug Discovery
  AI-powered Tutoring & Learning Companion Apps
  Subscription-based Home Services Markets
  Skincare & Makeup Apps
  Virtual Care Coordination & Collaboration
  Wildlife Tracking Apps
  Virtual Try-On Apps
  Microbiome Analysis & Personalized Probiotics
  Camping Gear Platforms
  Fitness and Training Apps
  Blockchain Gaming Platforms
  Fashion Trend Analysis Software
  Fashion Resale and Secondhand Platforms
  Food Reservation & Delivery Apps
  Solid-State Battery Management Systems
  Subscription Box Services
  Fan Engagement and Loyalty Platforms
  Messaging Apps
  Music Publishing and Royalty Platforms
  Virtual Reality Gaming
  Insurance Tech Platforms
  Group Activity Planning Apps
  Gear Rental Platforms
  Virtual Field Trip Platforms
  Zero-Waste Packaging & Shipping Solutions
  Virtual Classroom Platforms
  BCI-enhanced Learning & Training Apps
  BCI-based Neurorehabilitation Tools
  Matchmaking Apps
  Virtual Hair Styling & Color Simulation
  Personal Finance Software
  AI Video Analytics & Surveillance
  Meal Kit Delivery Services
  Micromobility Battery Swapping & Maintenance
  Privacy-focused Decentralized Social Networks & Messaging
  Professional Development & Upskilling
  Fishing Apps
  E-sports Platforms
  Metamaterial Antenna Design Software
  Learning Management Systems (LMS)
  VR Film Experiences
  Travel Insurance Platforms
  Robo-Advisors
  AI-powered Personalization & Recommendation Engines
  Electric Vehicle Charging Locators
  Home Automation & IoT Platforms
  Tax Preparation Software
  Neuromorphic Speech Recognition
  DeFi Yield Optimization Platforms
  Adventure Travel Apps
  Online Proposal Planning Services
  Smart Pet Accessories & Wearables
  Blockchain-based Supply Chain Transparency
  Event Planning Services
  Skill Assessment Tools
  Mental Health Tracking & Support
  Outdoor Sports Club & Community
  Digital Art and Portfolio Platforms
  Virtual Team Building & Engagement
  Game Development Software
  AI-driven Sales Forecasting & Demand Planning
  Music Collaboration Tools
  Online Learning Platforms
  AI-powered Assistive Technology & Communication Aids
  Personal Styling Apps
  Solid-State Battery Mfg Process Control
  Inclusive Virtual Try-on & Personalization for Fashion/Beauty
  Bioprinting Process Control/Monitoring
  Romantic Getaway Booking Apps
  Cryptocurrency Exchanges
  Music Production Software
  Quantum Optimization Solvers
  Game Streaming Services
  Conversational AI & Chatbot Platforms
  Sports Streaming and Media Platforms
  AI-powered Image & Video Editing
  Recipe Apps
  Online Cooking Classes and Platforms
  Autonomous Vehicle Fleet Management
  In-Car Entertainment & Infotainment
  Wealth Management Software
  Pharmacogenomics & Personalized Medication
  Online Dating Services
  AI-driven Predictive Analytics for Healthcare
  Gifting Apps
  Relationship Counseling Apps
  Concert Services & Livestreaming
  Zero-Knowledge Proof & Secure Credential Sharing
  Neuromorphic Sensor Processors
  Productivity & Time Tracking Apps
  Financial News and Analysis Platforms
  Select the market segment that is most appropriate and aligns closely with the business concept or idea.
  
  Output Format:
  { 
    problem: [Closest Problem Statement from List],
    market: [Closest Market Segment from List]
  }
  Your response should be a JSON object in given output format only, without any other description or statements
  
  Illustrative Examples:
  Input: 
  app for comparing auto repair services
  Output: {
    problem: Long-term value of electric cars is uncertain for buyers,
    market: Auto Parts & Accessories E-commerce
  }
  Input: 
  Freelance platform for creative professionals
  Output: {
    problem: Finding suitable part-time work is challenging,
    market: Professional Development & Upskilling
  }
  Input: 
  AI-driven contract negotiation tool
  Output: {
    problem: Legal services are expensive and intimidating,
    market: AI Legal Technology
  }
  Input: 
  personal finance app that tracks spending habits and gives personalized tips
  Output: {
    problem: Managing personal finances is overwhelming for many people,
    market: Personal Finance Software
  }
  Input: 
  VR game that combines fitness and adventure
  Output: {
    problem: Working from home often leads to procrastination and distractions,
    market: Virtual Reality Gaming
  }
  
  Additional Guidelines:
  Relevance: Ensure the chosen problem directly relates to the core function or benefit of the business concept.
  Also, Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
  Also, ensure that the problem and market should be selected from the given list and strictly do not recommend any other problem or market which is not available in the list
  Strictly ensure that you return only the required JSON parsable response and nothing else and the strings should be in quotes`,
  SOFTWARE_TECHNOLOGY: {
    PROBLEM_MARKET_SELECTOR: `Objective: To match a user input, which is always a business concept or idea, to a problem and a market segment from a specific list. The assistant should ensure the chosen problem and market segment are the closest and most relevant to the given business concept or idea.

  Instructions:
  Input:
  Receive a business concept or idea from the user.
  
  Matching Process:
  Problem Matching:
  Please select a problem from this list that is closest to the user input:
  Cryptocurrency markets are highly volatile and risky
  Accessible education in remote areas is limited
  City parking is expensive and limited in availability
  Education for incarcerated individuals is often limited
  Millennials prefer subscription-based car ownership
  Tailoring clothes for a perfect fit is expensive and time-consuming
  Electric and eco-friendly cars are expensive for consumers
  Frequent doctor visits for chronic issues are inconvenient
  High-demand sports tickets sell out quickly
  Busy professionals seek quick, healthy meal solutions
  Social media often leads to shallow relationships
  Job training for underserved youth is often limited
  Screening for rare diseases is expensive and limited
  Finding reliable and vetted home repair professionals is challenging
  Engaging remote event attendees is challenging
  Accessible transportation in rural areas is limited
  Busy parents want on-demand childcare services
  One-size-fits-all education fails to meet individual needs
  Sports streaming packages are expensive for viewers
  Cryptocurrency exchanges lack robust security measures
  Accessible mental health support is often limited
  Mental health support for seniors is often limited
  Coordinating care for elderly relatives across family members is difficult
  Remote workers seek flexible co-working space rentals
  Difficult to find eco-friendly products for kids
  Limited plus-size options in sustainable fashion
  Finding reliable and vetted personal fitness trainers is challenging
  Gen Alpha expects gamified educational content
  Limited sustainable options for baby products
  Managing digital assets and passwords after death is complex
  Online classes can be disengaging for many students
  Dating platforms often enable harassment of users
  Finding size-inclusive clothing rental options is limited
  Freelancers need project-based health insurance options
  Purebred dogs are expensive to purchase and maintain
  Outdoor enthusiasts seek sustainable gear options
  Online therapy lacks the human connection of in-person sessions
  Finding reliable and vetted home organizers is time-consuming
  Finding reliable and vetted tutors for specific subjects is time-consuming
  Finding ethical and sustainable fashion options is time-consuming
  Limited mental health resources for minority groups
  Working parents need flexible, on-demand pet care services
  Coordinating shared childcare for non-traditional work schedules is difficult
  Finding reliable and vetted elder care services is challenging
  Parents want kid-safe social media platforms
  Professional-grade cameras are costly for hobbyists
  Wearable devices often have short battery life
  Access to healthcare in rural areas is limited
  Buildings often have high energy consumption rates
  Limited fashion options for plus-size teens
  Limited sustainable menstrual product options
  Finding reliable and vetted personal financial advisors is time-consuming
  Managing personal digital content creation and monetization is disorganized
  Communication with remote teams can be ineffective
  Manual invoice processing is prone to errors
  Interpreting personal health data is often confusing
  Unexpected appliance breakdowns are costly and inconvenient
  Gen Z expects instant, mobile-first customer service
  Gen-Z consumers prefer video content over pictures or text
  Customizing meal plans for specific health conditions is complex
  Limited culturally diverse skin care products
  Managing personal education and skill development plans is disorganized
  Cryptocurrency and DeFi platforms are confusing for newcomers
  Reselling used textbooks is often difficult
  Gen Z prefers mobile-first insurance solutions
  Non-English speakers lack localized streaming content
  Electric cars have limited battery range for long trips
  Busy professionals want on-demand home cleaning
  Coordinating multi-family childcare arrangements is complex
  Energy management in low-income homes is challenging
  Sitting in traffic wastes valuable time
  Continuing education while working full-time is challenging
  Energy management in homes is frequently inefficient
  Coordinating group travel for people with diverse needs is complex
  Gig workers need flexible financial planning tools
  Edtech raises concerns about student data privacy protection
  Low-income areas lack access to fresh produce delivery
  Minimalists seek multi-functional home goods
  Tech-averse seniors need simplified telehealth services
  Concert ticket sites charge excessive processing fees
  Plus-size and inclusive sizing options are limited in fashion
  Clean energy access in off-grid areas is limited
  Dating apps are populated with fake or inactive profiles
  Learning new skills often lacks motivation for self-learners
  Non-tech-savvy users struggle with smart home devices
  Virtual reality gaming equipment is expensive
  Creating custom travel itineraries is time-intensive
  Working mothers need flexible fitness class schedules
  Low-income families lack affordable tutoring services
  Managing personal genetic data and health insights is overwhelming
  Rural areas have limited access to grocery delivery
  Limited fashion options for gender non-conforming individuals
  Business learning tools often lack personalization for users
  Comparing insurance options is confusing for many consumers
  Compatibility between smart home equipment is often limited
  Smart homes raise privacy and security concerns
  Working from home can lead to loneliness and burnout
  Managing personal energy usage and efficiency is cumbersome
  Managing personal legal document archives is disorganized
  Students seek affordable textbook rental options
  Gen Z expects augmented reality shopping experiences
  Non-drivers seek better last-mile transportation solutions
  Organizing and digitizing old family photos is tedious
  Personalizing language learning to individual goals is difficult
  Finding suitable part-time work is challenging
  Cybersecurity threats are increasing in frequency and complexity
  Old buildings have high energy costs for occupants
  Remote work collaboration is challenging for many teams
  Cheating and hacking ruins online gaming experiences
  Data privacy compliance is complex and challenging for companies
  Sensitive data is vulnerable to theft by hackers
  Immigrants struggle to access credit-building services
  Managing personal collections of digital memories and life events is overwhelming
  Mental health support for LGBTQ+ individuals is often limited
  Finding reliable and vetted personal stylists is difficult
  Building trust and deep connections in online communities is difficult
  Managing multiple passwords securely is frustrating for users
  Professional certifications are often prohibitively expensive
  Skiing and snowboarding gear is expensive for casual users
  Mental health support for new mothers is often limited
  LGBTQ+ community seeks inclusive dating apps
  Tracking home maintenance schedules is often overlooked
  Internet connectivity is limited in many rural areas
  Lead generation is often ineffective for many businesses
  Finding reliable and vetted personal chefs for dietary needs is challenging
  Choosing outfits daily is time-consuming
  Managing personal finances is overwhelming for many people
  Energy storage for renewable sources is often inefficient
  Home workout equipment is costly for beginners
  Taking phone calls in noisy places is challenging
  Wedding planning is often stressful and overwhelming
  Carrying multiple payment and loyalty cards is cumbersome
  Tech-savvy seniors seek age-appropriate social platforms
  Coordinating shared ownership and maintenance of community spaces is complex
  Ineffective methods for protecting against in-game cheating and hacks
  High-end smart home devices are prohibitively expensive
  Investment and trading platforms often charge high fees
  Customer data is often fragmented across multiple systems
  Overcoming public speaking anxiety is challenging for many
  Football raises long-term safety and health concerns
  Business intelligence is often fragmented across multiple tools
  Online meditation classes often lack the ambiance of in-person sessions
  Coordinating neighborhood renewable energy initiatives is complex
  Finding culturally appropriate etiquette advice for travelers is difficult
  Quality specialty shoes are expensive for consumers
  Payroll processing is error-prone and time-consuming
  Quality camping gear is expensive for casual campers
  Social media platforms lack robust privacy controls
  Device batteries degrade significantly over time
  Gauging compatibility from online profiles is challenging
  Textbooks are heavy and quickly become outdated
  Air pollution monitoring in cities is often inadequate
  Telemedicine apps can be challenging for seniors to use
  Supply chain visibility is limited for many businesses
  Organizing community sports leagues is administratively burdensome
  Project management often lacks visibility for stakeholders
  Conflicting healthy eating information abounds online
  Controlling multiple smart home devices is complex
  In-game purchases create unfair advantages for players
  Online gaming communities can be toxic for newcomers
  Locating charged micromobility vehicles can be difficult
  Medication effectiveness varies widely between individuals
  Marketing ROI is difficult to measure accurately
  Finding short-term workspace in unfamiliar cities is time-consuming
  Limited adaptive sportswear options for disabled athletes
  Neurodiverse children need adapted learning apps
  Legal services are expensive and intimidating
  Coordinating shared ownership of vacation properties is complex
  Finding reliable and vetted home stagers for real estate is time-consuming
  Non-English speakers need localized financial literacy tools
  Retirees struggle to find part-time job opportunities
  Finding age-appropriate volunteer opportunities for kids is challenging
  Seniors struggle with digital-only banking services
  Challenges in accessing mental health support and therapy
  Customer support is frequently slow and inefficient
  Healthcare access for migrant workers is often limited
  Blockchain technology is difficult for laypeople to understand
  Effective time management is challenging for many individuals
  Professional video equipment is cost-prohibitive
  High-quality drawing tablets are prohibitively expensive
  Visualizing furniture placement before purchasing is difficult
  Niche professional education topics have limited resources
  Understanding sports betting complexities
  Video editing software has a steep learning curve
  Vegans struggle to find suitable meal kit options
  Comparing moving company prices is time-consuming
  Difficult to find teen-friendly banking products and services
  Older generations struggle with cryptocurrency platforms
  Quality backpacking and camping gear is expensive
  Employee engagement is low in many workplaces
  Quality educational tools are expensive for schools
  Cameras are often bulky and prone to damage
  Estate planning is complex and often neglected by individuals
  Managing family medical history across generations is disorganized
  Travelers with disabilities lack accessible booking options
  Finding specific information in user manuals is time-consuming
  PTSD support for veterans is often inaccessible
  Coordinating group gift-giving for special occasions is cumbersome
  Supply chains often lack transparency for consumers
  Clean energy access in developing nations is limited
  Financial services for unbanked populations are limited
  Organizing digital files efficiently is challenging for many users
  Conducting genealogy research is time-consuming and complex
  Tracking and improving sleep patterns is challenging for many
  IT support is frequently overwhelmed in many organizations
  Dating apps lack specific filters for compatibility
  Finding licensed CBT therapists can be challenging
  Gen X prefers desktop-based productivity tools
  Managing multiple rental properties is administratively burdensome
  Parking meter payment options are often restricted
  Navigating busy stadiums and parking lots is frustrating
  High-end skincare products are expensive for consumers
  Live sports event tickets are expensive for fans
  Golf equipment is prohibitively expensive for beginners
  Achieving complex hairstyles often requires a professional
  Professional animal training services are expensive
  Premium personal branding tools have limited availability
  Talent retention is challenging for many organizations
  Finding reliable pet sitters for exotic pets is challenging
  Tracking personal carbon emissions is cumbersome
  Supply chain issues frequently cause product shortages
  Screen time raises concerns for child development
  Multiple streaming subscriptions become expensive
  Trendy clothes often sacrifice quality for affordability
  Premium running smartwatches are expensive
  Audio quality often suffers on music streaming platforms
  Finding reliable home service providers is often challenging
  Internal communication is often disjointed in organizations
  Sports betting often distracts from the enjoyment of game viewing
  Coordinating carpools for kids' activities is logistically challenging
  Organizing neighborhood watch programs is logistically challenging
  Non-native speakers struggle with voice assistants
  Organ transplant waitlists are often extremely long
  Healthcare access in conflict zones is often limited
  Ocean plastic pollution monitoring is often inadequate
  Finding reliable information on health symptoms is often difficult
  Football equipment is expensive for casual players
  Finding age-appropriate activities for kids is challenging for parents
  Dating sites lack nuanced compatibility filtering options
  Popular ski resorts often become overcrowded
  Securely transferring or reselling tickets is challenging
  Gauging compatibility through online dating is challenging
  Handwritten notes are easily lost or damaged
  Budgeting without professional advice can be challenging
  Virtual personal styling services often feel impersonal
  Exotic pets and their habitats are very expensive
  Managing personal art collections and provenance is challenging
  Coordinating care for elderly family members is challenging
  Online tutoring often lacks personalization for students
  Introverts prefer text-based customer support
  Coordinating shared ownership of expensive equipment is complex
  Greenhouse gas emissions monitoring is often inadequate
  Organizing and cataloging personal book collections is tedious
  Water usage in agriculture is frequently inefficient
  Losing keys is costly and inconvenient
  Finding reliable product reviews is challenging for consumers
  Sales pipeline management is often manual and inefficient
  Trying on clothes in stores is inconvenient
  Online friendships often focus too much on popularity metrics
  Sports live streams often buffer or lag during peak times
  Hunting gear is prohibitively expensive for newcomers
  Meal planning is time-consuming for busy individuals
  Travel booking sites often have hidden fees
  Tracking health metrics can be cumbersome for individuals
  Household energy costs are high in many areas
  Neurodivergent individuals need adapted job boards
  Urban traffic congestion management is challenging
  Agricultural water usage management is frequently inefficient
  Learning to create digital art has a steep learning curve
  Rock climbing equipment is expensive for beginners
  Working from home often leads to procrastination and distractions
  Regional blackouts restrict access to sports streams
  Online forums can enable unhealthy coping post-breakup
  Industry compliance is overwhelming for many businesses
  Managing personal collections of digital creative works is disorganized
  Managing personal wine collections and tasting notes is disorganized
  Night shift workers lack suitable food delivery options
  Limited resources for improving gaming skills and strategies
  Gene therapy treatments are rare and prohibitively expensive
  Waste management in cities is frequently inefficient
  Limited resources for learning to play musical instruments online
  Water quality monitoring systems are often inadequate
  Navigating complex financial regulations is challenging
  Energy management in manufacturing is challenging
  Forest fire detection systems are often inadequate
  Last-mile delivery in cities is often inefficient
  Energy management in commercial buildings is challenging
  ID verification processes are time-consuming and intrusive
  Special needs resources are limited for families
  Professional music production software is expensive
  Building a consistent networking habit is challenging
  Product packaging often creates excessive waste
  Recycling of electronic waste is frequently inefficient
  Organ transplant recipients risk rejection complications
  Finding local events and activities can be difficult in some areas
  Fostering deeper connections between fans and teams is challenging
  Self-help gurus often peddle pseudoscience to followers
  Education access for refugees is often limited
  Long-term value of electric cars is uncertain for buyers
  Product development processes are often slow and inefficient
  Real-time market data often requires paid subscriptions
  Long lines at sports events detract from the experience
  Finding reliable vacation rental reviews is difficult
  Finding cheap, comfortable home office equipment is difficult
  Comparing travel prices across platforms is time-consuming
  Professional makeup tools are expensive for beginners
  Constant monitoring is needed while cooking
  Ensuring kids meet nutrition guidelines is challenging
  Planning unique and creative dates is challenging
  Discovering new podcasts and audiobooks is time-consuming
  Some eco-friendly products lack long-term durability
  Managing multiple subscriptions is time-consuming
  Lost and found systems are often inefficient
  Maintaining consistent mindfulness practice is challenging
  Package shipping often experiences delays and mistakes
  Online language learning lacks true immersion experiences
  Wildfire smoke pollution monitoring is often inadequate
  Monitoring of industrial emissions is often inadequate
  Air quality monitoring in schools is often inadequate
  Online shoe sizing information is frequently inaccurate
  Comparing insurance options is complex and time-consuming
  Finding high-quality public speaking techniques is difficult
  Coordinating attendee schedules for events is challenging
  Comparing college options is daunting for prospective students
  Arranging pet sitting services is often challenging for pet owners
  Language barriers complicate international travel
  Limited access to personalized tutoring for complex subjects
  Eco-friendly home upgrades are often expensive
  Coupon clipping is tedious and time-consuming
  Difficulty in receiving tailored nutritional advice and meal plans
  Employee onboarding processes are often time-consuming for companies
  Limited resources for reducing personal carbon footprint
  Paper receipts are easily lost or damaged
  Affordable housing in urban slums is scarce
  Conflicting information on healthy eating found online
  Language barriers complicate independent trip planning
  Limited cloud storage for high-resolution video files
  Few tools exist to track child behavior patterns
  Customer feedback is poorly managed in many organizations
  Excessive product placement disrupts reality TV viewing
  Sports streams lack personalization options for viewers
  Purebred cats often have breed-specific health issues
  Mindfulness apps and courses are often expensive
  Public soccer fields are limited in many areas
  Coordinating community garden plots and harvests is logistically challenging
  Cancelling subscriptions is often unnecessarily complicated
  Select the problem that is most closely related to the business concept or idea.
  
  Market Segment Matching:
  Please select a market segment from the following list that is closest to the user input:
  AI-powered Predictive Maintenance
  Educational Apps and Games
  Grocery Delivery Services
  AI Music Composition Tools
  Home Office Equipment E-Comm
  Remote Patient Monitoring & Wearable Integration
  Car Rental Apps
  Fashion E-commerce Platforms
  Digital Payments Software
  Social Media Platforms
  Micromobility Data Analytics & Insights
  Mobile Gaming Apps
  Corporate Training Software
  Auto Parts & Accessories E-commerce
  Telemedicine Practice Mgmt & EHR Systems
  Test Preparation Apps
  Fantasy Sports Platforms
  Solar Panel & Renewable Energy Markets
  Collectibles Authentication & Valuation
  AI Legal Technology
  Music Streaming Services
  Language Learning Software
  Sports Analytics Software
  P2P Lending Platforms
  Cycling Apps
  Personalized Learning Path & Recommendation Engines
  AI Script Writing Tools
  Sports Event Ticketing Software
  Stock Trading Platforms
  Virtual Reality Social Platforms
  Cloud Gaming Services
  E-books and Digital Libraries
  Video Streaming Services
  Gamified Employee Engagement & Performance Mgmt
  Sports Betting Software
  Online Ticket Booking Platforms
  Video on Demand (VOD) Services
  Custom Tailoring Apps
  Online Tutoring Services
  AI-powered Personalized Drug Discovery
  AI-powered Tutoring & Learning Companion Apps
  Subscription-based Home Services Markets
  Skincare & Makeup Apps
  Virtual Care Coordination & Collaboration
  Wildlife Tracking Apps
  Virtual Try-On Apps
  Microbiome Analysis & Personalized Probiotics
  Camping Gear Platforms
  Fitness and Training Apps
  Blockchain Gaming Platforms
  Fashion Trend Analysis Software
  Fashion Resale and Secondhand Platforms
  Food Reservation & Delivery Apps
  Solid-State Battery Management Systems
  Subscription Box Services
  Fan Engagement and Loyalty Platforms
  Messaging Apps
  Music Publishing and Royalty Platforms
  Virtual Reality Gaming
  Insurance Tech Platforms
  Group Activity Planning Apps
  Gear Rental Platforms
  Virtual Field Trip Platforms
  Zero-Waste Packaging & Shipping Solutions
  Virtual Classroom Platforms
  BCI-enhanced Learning & Training Apps
  BCI-based Neurorehabilitation Tools
  Matchmaking Apps
  Virtual Hair Styling & Color Simulation
  Personal Finance Software
  AI Video Analytics & Surveillance
  Meal Kit Delivery Services
  Micromobility Battery Swapping & Maintenance
  Privacy-focused Decentralized Social Networks & Messaging
  Professional Development & Upskilling
  Fishing Apps
  E-sports Platforms
  Metamaterial Antenna Design Software
  Learning Management Systems (LMS)
  VR Film Experiences
  Travel Insurance Platforms
  Robo-Advisors
  AI-powered Personalization & Recommendation Engines
  Electric Vehicle Charging Locators
  Home Automation & IoT Platforms
  Tax Preparation Software
  Neuromorphic Speech Recognition
  DeFi Yield Optimization Platforms
  Adventure Travel Apps
  Online Proposal Planning Services
  Smart Pet Accessories & Wearables
  Blockchain-based Supply Chain Transparency
  Event Planning Services
  Skill Assessment Tools
  Mental Health Tracking & Support
  Outdoor Sports Club & Community
  Digital Art and Portfolio Platforms
  Virtual Team Building & Engagement
  Game Development Software
  AI-driven Sales Forecasting & Demand Planning
  Music Collaboration Tools
  Online Learning Platforms
  AI-powered Assistive Technology & Communication Aids
  Personal Styling Apps
  Solid-State Battery Mfg Process Control
  Inclusive Virtual Try-on & Personalization for Fashion/Beauty
  Bioprinting Process Control/Monitoring
  Romantic Getaway Booking Apps
  Cryptocurrency Exchanges
  Music Production Software
  Quantum Optimization Solvers
  Game Streaming Services
  Conversational AI & Chatbot Platforms
  Sports Streaming and Media Platforms
  AI-powered Image & Video Editing
  Recipe Apps
  Online Cooking Classes and Platforms
  Autonomous Vehicle Fleet Management
  In-Car Entertainment & Infotainment
  Wealth Management Software
  Pharmacogenomics & Personalized Medication
  Online Dating Services
  AI-driven Predictive Analytics for Healthcare
  Gifting Apps
  Relationship Counseling Apps
  Concert Services & Livestreaming
  Zero-Knowledge Proof & Secure Credential Sharing
  Neuromorphic Sensor Processors
  Productivity & Time Tracking Apps
  Financial News and Analysis Platforms
  Select the market segment that is most appropriate and aligns closely with the business concept or idea.
  
  Output Format:
  { 
    problem: [Closest Problem Statement from List],
    market: [Closest Market Segment from List]
  }
  Your response should be a JSON object in given output format only, without any other description or statements
  
  Illustrative Examples:
  Input: 
  app for comparing auto repair services
  Output: {
    problem: Long-term value of electric cars is uncertain for buyers,
    market: Auto Parts & Accessories E-commerce
  }
  Input: 
  Freelance platform for creative professionals
  Output: {
    problem: Finding suitable part-time work is challenging,
    market: Professional Development & Upskilling
  }
  Input: 
  AI-driven contract negotiation tool
  Output: {
    problem: Legal services are expensive and intimidating,
    market: AI Legal Technology
  }
  Input: 
  personal finance app that tracks spending habits and gives personalized tips
  Output: {
    problem: Managing personal finances is overwhelming for many people,
    market: Personal Finance Software
  }
  Input: 
  VR game that combines fitness and adventure
  Output: {
    problem: Working from home often leads to procrastination and distractions,
    market: Virtual Reality Gaming
  }
  
  Additional Guidelines:
  Relevance: Ensure the chosen problem directly relates to the core function or benefit of the business concept.
  Also, Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
  Also, ensure that the problem and market should be selected from the given list and strictly do not recommend any other problem or market which is not available in the list
    Strictly ensure that you return only the required JSON parsable response and nothing else and the strings should be in quotes`,
    PRODUCTIZATION: `Objective:
    Use the problem statement and market segment in the user input to identify a manual service that is currently the best solution to a specific aspect of the problem and create a novel business concept that automates and streamlines the solution. This business concept should compete in the market segment identified in the user input. The business concept must not already exist.
    
    Step 1: Analyze Manual Process Problem
    Identify the most manual service that directly or indirectly solves the problem and note the biggest operational issues (e.g., inefficiencies, user complaints, industry reports).
    Focus on the friction users experience from either (1) the effort and time required to perform the service manually or (2) the lack of consistency and reliability in the manual process. Consider programs or services that currently require many human beings to produce a high quality product. 
    
    Step 2: Create Business Concept & Description
    Develop a business concept that directly solves the chosen problem, competes in the chosen market segment from the user input and automates the manual process observed. This new business concept must be a novel and unprecedented way to automate and streamline the manual process. The core focus of the business concept must be to systemize the manual service that it replaces while focusing on one individual pain point that is most prominently driven by manual processes and feature a novel, unique product feature that directly automates the identified pain point. Consider how the concept could replace programs or services that currently require many human beings to produce a high quality product and how this automated and systemized workflow can continue to provide as high quality of a product by leveraging cutting edge technology, etc.
    
    Employ one of two strategies to do so:
    Strategy 1 - Fully Automated Workflow: Specify the target consumers and how the business will replace manual tasks with automated workflows in a way that existing solutions do not.
    Strategy 2 - Automate program or service with tech: Describe the automated service, user experience, and specific consumer it is meant for, emphasizing how it leverages technology like AI to rethink existing manual services.
    
    Step 3: Follow the below output format
    Output: Format the output to include:
    Business Overview: A 3-5 word description of the core concept.
    Business Description: A one-sentence concise description including:
    Core feature/functionality
    Specific audience
    Manual Process Problem Description: The first sentence will describe existing demand for a service or product that uses a manual process causing users to face inefficiencies or inconsistencies. The second sentence will comment on how the concept directly addresses this issue by systemizing and automating the process.
    Problem: Problem directly solved (from the user input)
    Market Segment: Market segment directly mapped (from the user input)
    
    Your response should be a JSON object in given output format only, without any other description or statements
    Example Outputs:
    
    User input: 
    Customer support is frequently slow and inefficient
    Fashion E-commerce Platforms
    Output: {
      idea: "Automated E-commerce Support",
      description: "AI-driven customer service platform for e-commerce businesses, offering real-time, personalized support and efficient issue resolution.",
      strategy: ["Customer service for e-commerce retailers requires human representatives to handle diverse issues, involving extensive research and communication." ,"The AI solution automates interactions by collecting detailed context and offering clear options, reducing costs and improving customer satisfaction through faster issue resolution."],
      problem: "Customer support is frequently slow and inefficient",
      market: "Fashion E-commerce Platforms",
    }
    
    User input: 
    ID verification processes are time-consuming and intrusive
    Insurance Tech Platforms
    Output: {
      idea: "Digital Notarization Service",
      description: "Remote notarization platform for legal and real estate sectors, enabling on-demand identity verification and electronic notarization.",
      strategy: ["Notarizing documents is cumbersome, requiring physical presence and causing inefficiencies.", "The technology solution enables on-demand identity verification and electronic notarization, increasing flexibility and maintaining high security standards."],
      problem: "ID verification processes are time-consuming and intrusive",
      market: "Insurance Tech Platforms",
    }
    
    User Input:
    Unexpected appliance breakdowns are costly and inconvenient
    AI-powered Predictive Maintenance
    Output: {
      idea: "Automated HVAC Maintenance",
      description: "IoT and AI-based platform for HVAC maintenance, providing real-time monitoring and predictive upkeep to reduce repair costs for homeowners.",
      strategy: ["HVAC maintenance involves manual inspections and scheduling professional check-ups, often leading to inefficiencies and breakdowns." ,"The solution uses IoT sensors for real-time monitoring and AI for predictive maintenance, ensuring timely upkeep and reducing repair costs."],
      problem: "Unexpected appliance breakdowns are costly and inconvenient",
      market: "AI-powered Predictive Maintenance",
    }
    Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Strictly ensure that you return only the required JSON parsable response and nothing else`,
    DISTRIBUTION: `Objective:
    Transform user-provided problem statement and market segment into refined business opportunities that have distinct distribution models and provide the best business opportunity. The transformed business opportunities must solve the problem from the user input as well as compete in the market segment provided. They must employ one of two specific strategies that solve an existing distribution problem within the segment.
    
    Input:
    A problem statement
    A market segment
    
    Step 1: Analyze Distribution Problem
    Identify existing products that solve the problem and note the biggest distribution issues (e.g., user complaints, industry reports, social media discussions).
    Focus on the friction users experience from either (1) the format and user experience of existing products/offerings that are not native or preferred by a specific audience or (2) users go out of their way to use the product, not in a native and seamless channel that most directly fits the activity. For example you want to learn about a financial topic right before you make that financial decision, or you want to find a cooking recipe while your shopping for groceries or about to cook a meal. 
    Use these insights to tailor the business opportunity, ensuring it addresses these specific distribution challenges.
    Develop a brief description of the unique distribution problem that exists and how the proposed product uniquely addresses this problem.
    
    Create Business Description:
    Develop a completely novel and unique business description that addresses the unique distribution problem using one of two distribution strategies for the given product space/industry:
    Strategy 1 - Creates an unprecedented distribution channel that meets consumers where they already are: Specify the target consumers and how the business will integrate into their native environment in a way that existing solutions do not.
    Strategy 2 - Creates an unprecedented and completely novel format and tailored user experience: Describe the format, user experience, and specific consumer it is meant for, emphasizing how it differs from and improves upon existing solutions.
    
    Output:
    Format the output to include:
    Business Overview: A 3-5 word description of the core concept.
    Business Description: A one-sentence concise description including:
    Unique distribution approach/strategy
    Core feature/functionality
    Specific audience
    Distribution Problem Description: The first sentence will describe the distribution problem with existing products and offerings where users want the product badly enough to still use the product but is either not in their preferred, native format or doesn't meet them doing the right activity in the right moment to use the product. The second sentence will comment on how the concept directly addresses this issue.
    Problem: Problem solved (from user input)
    Market Segment: Relevant market segment (from user input)
    
    Your response should be a JSON object in given output format only, without any other description or statements
    Example Outputs:
    
    User input: 
    Gen-Z consumers prefer video content over pictures or text
    Food Reservation & Delivery Apps
    Output: {
      idea: "TikTok for Restaurant Reviews",
      description: "A mobile app curating short-form videos of restaurant ambiance and menu highlights, targeting Gen Z's preference for visual food discovery.",
      strategy: ["Although Gen-Z reports wanting to discover new restaurants, existing restaurant discovery platforms focus on text/picture content." ,"This concept re-formats the restaurant discovery experience by engaging Gen-Z through short-form video, their preferred content format."],
      problem: "Gen-Z consumers prefer video content over pictures or text",
      market: "Food Reservation & Delivery Apps",
    }
    
    User input: 
    Sitting in traffic wastes valuable time
    Conversational AI & Chatbot Platforms
    Output: {
      idea: "AI Event Planner while Driving",
      description: "An AI assistant that detects when your driving to plan social events, sync calendars, and coordinate with potential attendees.",
      strategy: ["Although most people want to plan fun social events, they often report not having the time." ,"This concept engages users when they have an abundance of time sitting in traffic to plan events hands free."],
      problem: "Sitting in traffic wastes valuable time",
      market: "Conversational AI & Chatbot Platforms",
    }
    
    User Input:
    Understanding sports betting complexities
    Sports Betting Software
    Output: {
      idea: "Honey for Live Sports Betting",
      description: "A browser extension that detects the sports game you're streaming and suggests relevant live bets based on real-time game analytics.",
      strategy: ["Although online sports streamers make up the majority of sports bettors by volume, this audience reports frustration with missing game action when placing bets on betting websites." ,"This concept finds streamers in their native environment, allowing them to bet without missing any action."],
      problem: "Understanding sports betting complexities",
      market: "Sports Betting Software",
    }
    Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Strictly ensure that you return only the required JSON parsable response and nothing else`,
    DOMINATE_NICHE: `Objective:
    Use the problem statement and market segment in the user input to identify a manual service that is currently the best solution to a specific aspect of the problem and create a novel business concept that automates and streamlines the solution. This business concept should compete in the market segment identified in the user input. The business concept must not already exist.
    
    Step 1: Analyze Manual Process Problem
    Identify the most manual service that directly or indirectly solves the problem and note the biggest operational issues (e.g., inefficiencies, user complaints, industry reports).
    Focus on the friction users experience from either (1) the effort and time required to perform the service manually or (2) the lack of consistency and reliability in the manual process. Consider programs or services that currently require many human beings to produce a high quality product. 
    
    Step 2: Create Business Concept & Description
    Develop a business concept that directly solves the chosen problem, competes in the chosen market segment from the user input and automates the manual process observed. This new business concept must be a novel and unprecedented way to automate and streamline the manual process. The core focus of the business concept must be to systemize the manual service that it replaces while focusing on one individual pain point that is most prominently driven by manual processes and feature a novel, unique product feature that directly automates the identified pain point. Consider how the concept could replace programs or services that currently require many human beings to produce a high quality product and how this automated and systemized workflow can continue to provide as high quality of a product by leveraging cutting edge technology, etc.
    
    Employ one of two strategies to do so:
    Strategy 1 - Fully Automated Workflow: Specify the target consumers and how the business will replace manual tasks with automated workflows in a way that existing solutions do not.
    Strategy 2 - Automate program or service with tech: Describe the automated service, user experience, and specific consumer it is meant for, emphasizing how it leverages technology like AI to rethink existing manual services.
    
    Step 3: Follow the below output format
    Output: Format the output to include:
    Business Overview: A 3-5 word description of the core concept.
    Business Description: A one-sentence concise description including:
    Core feature/functionality
    Specific audience
    Manual Process Problem Description: The first sentence will describe existing demand for a service or product that uses a manual process causing users to face inefficiencies or inconsistencies. The second sentence will comment on how the concept directly addresses this issue by systemizing and automating the process.
    Problem: Problem directly solved (from the user input)
    Market Segment: Market segment directly mapped (from the user input)
    
    Your response should be a JSON object in given output format only, without any other description or statements
    Example Outputs:
    
    User input: 
    Customer support is frequently slow and inefficient
    Fashion E-commerce Platforms
    Output: {
      idea: "Automated E-commerce Support",
      description: "AI-driven customer service platform for e-commerce businesses, offering real-time, personalized support and efficient issue resolution.",
      strategy: ["Customer service for e-commerce retailers requires human representatives to handle diverse issues, involving extensive research and communication." ,"The AI solution automates interactions by collecting detailed context and offering clear options, reducing costs and improving customer satisfaction through faster issue resolution."],
      problem: "Customer support is frequently slow and inefficient",
      market: "Fashion E-commerce Platforms",
    }
    
    User input: 
    ID verification processes are time-consuming and intrusive
    Insurance Tech Platforms
    Output: {
      idea: "Digital Notarization Service",
      description: "Remote notarization platform for legal and real estate sectors, enabling on-demand identity verification and electronic notarization.",
      strategy: ["Notarizing documents is cumbersome, requiring physical presence and causing inefficiencies." ," The technology solution enables on-demand identity verification and electronic notarization, increasing flexibility and maintaining high security standards."],
      problem: "ID verification processes are time-consuming and intrusive",
      market: "Insurance Tech Platforms",
    }
    
    User Input:
    Unexpected appliance breakdowns are costly and inconvenient
    AI-powered Predictive Maintenance
    Output: {
      idea: "Automated HVAC Maintenance",
      description: "IoT and AI-based platform for HVAC maintenance, providing real-time monitoring and predictive upkeep to reduce repair costs for homeowners.",
      strategy: ["HVAC maintenance involves manual inspections and scheduling professional check-ups, often leading to inefficiencies and breakdowns." ," The solution uses IoT sensors for real-time monitoring and AI for predictive maintenance, ensuring timely upkeep and reducing repair costs."],
      problem: "Unexpected appliance breakdowns are costly and inconvenient",
      market: "AI-powered Predictive Maintenance",
    }
    Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Strictly ensure that you return only the required JSON parsable response and nothing else`, //need to be updated
    PRODUCT_RATING: `Objective:
    Evaluate a given business idea/concept by rating its product on three different criteria:
    Sophistication and Advanced Nature
    Novelty and Uniqueness
    Suitability for a Specific Group of Customers
    The scores assigned will be between 1 and 100, never rounded to 0 or 5, and should always be an exact number. The overall rating will be an average of the three criteria scores.
    Note: Evaluate based solely on the provided description without assuming additional features or capabilities.
    
    Evaluation Criteria:
    Sophistication and Advanced Nature
    1-10: Basic materials and simple manufacturing processes.
    Examples: Simple wooden toys, basic hand-sewn garments.
    Typical in: Low-tech, artisanal products.
    11-20: Slightly better than basic, minimal material or process advancements.
    Examples: Simple mechanical tools with basic metal parts, basic kitchen gadgets made from standard plastics.
    Typical in: Entry-level household items, minimal manufacturing complexity.
    21-30: Some advanced materials or processes, but mostly standard.
    Examples: Basic electrical appliances using common components, standard furniture with minor innovations in materials.
    Typical in: Standard home appliances, basic office supplies.
    31-40: Moderately sophisticated materials or manufacturing processes.
    Examples: Ergonomic furniture with specialized foam, integrated smart home devices with basic electronics.
    Typical in: Modern household gadgets, office furniture.
    41-50: Fairly advanced materials or processes, noticeable improvements.
    Examples: Advanced kitchen appliances using high-quality metals and plastics, innovative sports equipment with specialized materials.
    Typical in: High-quality consumer electronics, fitness gear.
    51-60: Advanced materials or processes, incorporating recent trends.
    Examples: Wearable fitness trackers with advanced sensors, home automation systems with integrated IoT components.
    Typical in: Modern lifestyle products, advanced home solutions.
    61-70: Highly sophisticated materials or complex manufacturing processes.
    Examples: Advanced health monitoring devices with multiple sensors, high-tech home security systems with complex integration.
    Typical in: Innovative health products, smart home tech.
    71-80: Very advanced materials or processes, close to the latest innovations.
    Examples: AI-powered personal assistants with complex electronics, advanced robotics for home use.
    Typical in: Top-tier consumer electronics, futuristic household items.
    81-90: Extremely sophisticated materials or highly complex manufacturing processes.
    Examples: Pioneering renewable energy solutions with advanced materials, state-of-the-art medical devices requiring specialized production techniques.
    Typical in: Leading-edge health tech, innovative environmental products.
    91-100: Top-tier sophistication in materials and processes, leading-edge and pioneering. This also includes products that use completely new or rare ingredients or materials in innovative ways.
    Examples: Quantum computing devices for home use with specialized components, pioneering AR/VR integration in everyday products with complex manufacturing requirements, garments using rare and complex materials for enhanced functionality, soft drinks using new or rare ingredients.
    Typical in: Cutting-edge research tools, next-gen consumer products, high-end fashion, innovative consumables.
    
    Novelty and Uniqueness
    1-10: Very common, no unique aspects.
    Examples: Basic water bottles, generic notebooks.
    Typical in: Over-saturated markets, generic household items.
    11-20: Slightly uncommon, minor unique elements.
    Examples: Slight design tweaks, basic feature enhancements.
    Typical in: Basic home decor, slightly customized personal items.
    21-30: Some unique features, but largely similar to existing products.
    Examples: Unique branding, specific but minor feature enhancements.
    Typical in: Moderately differentiated consumer goods, common retail items.
    31-40: Moderately unique, stands out in some aspects.
    Examples: Unique materials, several distinct features.
    Typical in: Niche consumer products, specialized home goods.
    41-50: Fairly unique, distinct in several ways.
    Examples: Multiple innovative features, unique selling propositions.
    Typical in: Mid-range differentiated products, distinct retail items.
    51-60: Unique, has multiple innovative elements.
    Examples: Patented designs, original service models.
    Typical in: High-end consumer goods, advanced market-specific items.
    61-70: Highly unique, noticeable differentiation.
    Examples: Breakthrough features, significantly different user experience.
    Typical in: Premium lifestyle products, highly specialized home goods.
    71-80: Very unique, rarely seen in the market.
    Examples: Novel technologies, market-disrupting innovations.
    Typical in: Emerging market products, innovative B2B solutions.
    81-90: Extremely unique, groundbreaking.
    Examples: Revolutionary ideas, major industry shifts.
    Typical in: Top-tier innovative products, groundbreaking industry items.
    91-100: One-of-a-kind, highly innovative and original.
    Examples: First-of-its-kind technology, unprecedented market entries.
    Typical in: Market leaders, pioneering consumer goods.
    Suitability for a Specific Group of Customers
    1-10: Generic, no specific target audience.
    Examples: Mass-market household items, no customization.
    Typical in: General consumer products, undifferentiated goods.
    11-20: Vaguely defined audience, broad applicability.
    Examples: Basic segmentation, broad appeal.
    Typical in: General consumer items, basic personal products.
    21-30: Somewhat targeted, but still general.
    Examples: Broad demographic targeting, general marketing strategies.
    Typical in: Widely applicable household products, broad market goods.
    31-40: Moderately targeted, identifiable audience.
    Examples: Specific age groups, general industry applications.
    Typical in: Targeted consumer goods, industry-specific items.
    41-50: Fairly targeted, clear customer segment.
    Examples: Well-defined demographics, focused marketing.
    Typical in: Mid-market consumer goods, specialized household items.
    51-60: Well-targeted, specific customer base.
    Examples: Niche market segments, specific consumer needs.
    Typical in: Premium household products, targeted consumer goods.
    61-70: Highly targeted, well-defined niche market.
    Examples: Highly specific customer needs, specialized products.
    Typical in: High-end niche items, bespoke consumer goods.
    71-80: Very targeted, strong focus on a particular group.
    Examples: Highly specialized demographics, unique market needs.
    Typical in: Ultra-niche lifestyle products, highly specialized consumer goods.
    81-90: Extremely targeted, highly specialized audience.
    Examples: Very specific customer profiles, unique market segments.
    Typical in: Top-tier niche markets, exclusive consumer goods.
    91-100: Perfectly targeted, exceptionally well-suited for a specific group.
    Examples: Custom-built solutions, perfectly matched to customer needs.
    Typical in: Ultra-premium consumer products, bespoke household items.
    Output Format:
    Provide the scores in the following format:
    Sophistication Score: [Exact Score]
    One sentence description of the score.
    Unique Score: [Exact Score]
    One sentence description of the score.
    Audience Focus Score: [Exact Score]
    One sentence description of the score.
    Overall Score: [Average of the three scores]
    Note: Only consider explicitly mentioned advancements or features.
    
    Your response should be a JSON object in given output format only, without any other description or statements
    Illustrative Examples:
    Input: A sustainable toothbrush made from biodegradable bamboo and plant-based bristles. 
    Output:
    {
      "Sophistication Score": 35,
      "sophisticationDescription": "The product uses moderately sophisticated materials and simple manufacturing processes.",
      "Unique Score": 41,
      "uniqueScoreDescription": "Biodegradable bamboo and plant-based bristles offer some uniqueness in the market.",
      "Audience Focus Score": 38,
      "audienceFocusScoreDescription": "Targets environmentally conscious consumers, a broad but identifiable customer base.",
      "Overall Score": 38
    }

    Input: A modular smartphone with easily replaceable components for repair and upgrades. 
    Output:
    {
      "Sophistication Score": 92,
      "sophisticationDescription": "The product uses highly sophisticated materials and complex manufacturing processes for modularity.",
      "Unique Score": 85,
      "uniqueScoreDescription": "Modular and easily replaceable components make this smartphone highly unique and innovative.",
      "Audience Focus Score": 95,
      "audienceFocusScoreDescription": "Perfectly targeted at tech-savvy consumers and sustainability advocates who value repairability and upgradeability, making it exceptionally well-suited for its audience.",
      "Overall Score": 91
    }
    
    Input: A basic cotton t-shirt with a simple printed design. 
    Output:
    {
      "Sophistication Score": 15,
      "sophisticationDescription": "The product uses basic materials and simple manufacturing processes.",
      "Unique Score": 12,
      "uniqueScoreDescription": "A basic cotton t-shirt with a printed design offers minimal uniqueness.",
      "Audience Focus Score": 20,
      "audienceFocusScoreDescription": "Targets a very broad audience with no specific focus.",
      "Overall Score": 16
    }

    Input: A high-performance running shoe made from advanced lightweight materials and designed with AI-analyzed ergonomic support. 
    Output:
    {
      "Sophistication Score": 88,
      "sophisticationDescription": "The shoe uses advanced lightweight materials and AI-analyzed ergonomic support, requiring complex manufacturing.",
      "Unique Score": 83,
      "uniqueScoreDescription": "The combination of advanced materials and AI design makes the running shoe highly unique.",
      "Audience Focus Score": 80,
      "audienceFocusScoreDescription": "Targets professional and serious amateur runners, a well-defined niche market.",
      "Overall Score": 84
    }
    
    Input: A simple plastic water bottle with no special features. 
    Output:
    {
      "Sophistication Score": 10,
      "sophisticationDescription": "The product uses basic plastic and very simple manufacturing processes.",
      "Unique Score": 9,
      "uniqueScoreDescription": "A plain plastic water bottle offers no unique features.",
      "Audience Focus Score": 12,
      "audienceFocusScoreDescription": "Targets a very broad and undefined audience.",
      "Overall Score": 10
    }
    
    Input: A premium electric bicycle with regenerative braking and solar charging capabilities. 
    Output:
    {
      "Sophistication Score": 95,
      "sophisticationDescription": "The electric bicycle uses highly advanced materials and sophisticated manufacturing processes, including regenerative braking and solar charging.",
      "Unique Score": 90,
      "uniqueScoreDescription": "Regenerative braking and solar charging make this electric bicycle extremely unique and innovative.",
      "Audience Focus Score": 78,
      "audienceFocusScoreDescription": "Targets eco-conscious commuters and cycling enthusiasts, a well-defined niche market.",
      "Overall Score": 88
    }
    
    Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Strictly ensure that you return only the required JSON parsable response and nothing else`,
  },
  PHYSICAL_PRODUCT: {
    PROBLEM_MARKET_SELECTOR: `Objective: To match a user input, which is always a business concept or idea, to a problem and a market segment from a specific list. The assistant should ensure the chosen problem and market segment are the closest and most relevant to the given business concept or idea.

    Instructions:
    Input:
    Receive a business concept or idea from the user.
    
    Matching Process:
    Problem Matching:
    Please select a problem from this list that is closest to the user input:
    Headphones don't block all noise
    Frequent doctor visits for chronic issues
    Sitting all day hurts the back
    Winter coats aren't warm enough
    Expensive and limited city parking
    Sitting in traffic is a waste of time
    Accessible transportation in rural areas
    Electric/eco-friendly cars are expensive
    Mattresses get hot and uncomfortable
    One-size-fits-all education
    Job training for underserved youth
    Earbuds make ears sore
    Office chairs make backs ache
    Lack of accessible mental health support
    Inefficient energy management in homes
    Accessible education for incarcerated individuals
    Limited battery life in wearable devices
    Lack of accessible education in remote areas
    High energy consumption in buildings
    Work clothes are uncomfortable & fit poorly
    Food spoils quickly in the fridge
    Rare disease screening is expensive
    Difficult used textbook resale
    Bugs keep invading the house
    Hair dye damages hair
    Skincare products cause breakouts
    Leggings become see-through
    High-quality cameras are expensive
    Access to mental health support for seniors
    Acne treatments dry out skin
    Dust allergies are hard to manage
    Energy management in low-income homes
    Limited battery range on electric cars
    Tiny apartments lack storage space
    Purebred dogs are expensive
    Unexpected appliance breakdowns
    Moisturizers feel heavy on skin
    Limited access to healthcare in rural areas
    Meal prep takes too long
    Luggage falls apart after few trips
    Jeans wear out in the thighs
    Dress shoes hurt after hours
    Professional certifications are expensive
    Eye creams don't reduce puffiness
    Closets are always a mess
    Fitness supplements contain harmful additives
    Workout clothes retain odors
    Access to clean energy in off-grid areas
    VR gaming equipment is pricey
    Furniture doesn't fit small spaces
    Rain jackets aren't actually waterproof
    Winter coats aren't waterproof
    Kids' toys break too quickly
    Choosing outfits is time-consuming
    Continuing education while working is hard
    Face masks clog pores
    Skiing/snowboarding gear is expensive
    Plus-size/inclusive sizing options limited
    WFH loneliness and burnout
    Learning new skills lacks motivation
    Lipstick dries out lips
    Neighbors' noise is always audible
    Shampoo dries out hair
    Dress shirts wrinkle easily
    High energy cost in old buildings
    Smart homes have privacy/security risks
    Phone screens break too easily
    Beauty products have harmful chemicals
    Suitcases are a pain to carry
    Food & beverage ingredients are toxic
    Toothpaste doesn't whiten effectively
    Kids outgrow clothes too fast
    Sunburns happen despite sunscreen
    Internet connectivity in rural areas
    Mental health support for new mothers
    Healthy snacks taste bland
    Mental health support for LGBTQ+
    Indoor air feels stuffy and unhealthy
    Home workouts require too much space
    Shoes hurt feet after long walks
    Overcoming public speaking fear is hard
    Workout equipment is costly
    Football raises safety/health concerns
    Frozen meals lack fresh taste
    Heating bills are sky-high
    Locating charged micromobility vehicles
    Managing personal finances is overwhelming
    Carrying multiple payment/loyalty cards
    Heavy and quickly outdated textbooks
    Old appliances use too much power
    Sunscreen feels greasy on skin
    Supply chain visibility is limited
    Inefficient energy storage for renewables
    High-end smart home devices are pricey
    Visualizing furniture before purchasing
    Blankets are too hot or cold
    Wedding planning is stressful
    Bottled water creates plastic waste
    Mosquitoes ruin outdoor gatherings
    Poor lighting strains the eyes
    Quality video equipment is pricey
    Access to financial services for unbanked
    Portable chargers die too quickly
    Power outages disrupt everything
    Computer mice cause wrist pain
    Medication effectiveness varies
    Taking phone calls in busy/loud places
    Quality/specialty shoes are expensive
    Device batteries degrade over time
    Body lotions feel sticky
    Lack of transparency in supply chains
    Monitoring of air pollution in cities
    Tap water tastes funny
    Access to clean energy in developing nations
    BB creams have limited shades
    Backpacks strain the shoulders
    Nail polish chips quickly
    Access to healthcare for migrant workers
    Office lighting causes headaches
    Portable speakers sound tiny
    Smart home devices don't work together
    Wool sweaters are itchy
    Quality educational tools are expensive
    Compatibility of smart home equipment
    Backpacking/camping gear is expensive
    Golf equipment is expensive
    Laundry detergent doesn't remove stains
    Difficult to find specific info in user manuals
    Meditation classes lack ambiance
    Phones die during outdoor trips
    Face masks make breathing difficult
    Noise makes it hard to sleep
    Socks get holes easily
    Natural deodorants don't work well
    Product shortages from supply chain
    Time management is challenging
    Running smartwatches are expensive
    Coffee goes cold too quickly
    Budgeting without professional advice
    Achieving some hairstyles requires a pro
    House smells linger forever
    Controlling multiple smart home devices
    Premium personal branding tools limited
    Cameras are bulky and break easily
    Finding age-appropriate activities for kids
    Professional animal training is expensive
    Exotic pets/habitats are very expensive
    Camping gear is expensive
    Trendy clothes are low-quality
    Hard to navigate busy stadiums/parking lots
    Accessible legal services for low-income
    IT support is overwhelmed
    Gym equipment hogs living space
    Tracking and improving sleep
    Estate planning is complex
    Electric cars' long-term value uncertain
    Inaccessible PTSD support for veterans
    Employee engagement is low
    Hunting gear is expensive
    Dry shampoo leaves residue
    Rooms feel stuffy with no breeze
    High-end skincare is expensive
    Product development is slow
    Shower curtains get moldy fast
    Quality drawing tablets are pricey
    Tracking health metrics is cumbersome
    T-shirts shrink in the wash
    Special needs resources are limited
    VR headsets cause motion sickness
    Football equipment is expensive
    Screens cause eyestrain at night
    Litter boxes smell up the house
    Protein bars taste like cardboard
    Long organ transplant waitlists
    Inadequate monitoring of industrial emissions
    Monitoring of food safety in supply chains
    Hand creams leave hands greasy
    Talent retention is challenging
    Basements feel damp and moldy
    High household energy costs
    Indoor plants need constant care
    Monitoring of greenhouse gas emissions
    Inadequate monitoring of air quality in schools
    Energy management in manufacturing
    Handwritten notes are easily lost/damaged
    Losing keys is costly and inefficient
    Deodorants leave white marks
    Phone chargers are always missing
    Inefficient water usage in agriculture
    Stains won't come out of clothes
    Reusable water bottles retain smells
    Big furniture won't fit through doors
    Live sports event tickets are expensive
    Trying on clothes is inconvenient
    Deeper connections between fans & teams
    Juice contains too much sugar
    Management of urban traffic congestion
    Inadequate forest fire detection
    Comparing insurance options is confusing
    Finding reliable home service providers
    Meal planning is time-consuming
    Smartphones are hard to use one-handed
    Coordinating care for elderly family members
    Monitoring of ocean plastic pollution
    Gene therapy is rare & expensive
    Inefficient waste management in cities
    Long lines at sports events
    Energy drinks cause jitters
    Limited access to healthcare in conflict zones
    Limited access to education for refugees
    Pet sitting arrangements are difficult
    Coupon clipping is tedious
    Raincoats aren't breathable
    Inefficient recycling of electronic waste
    Popular ski resorts get crowded
    Shoe sizing info is inaccurate
    Difficult secure ticket transfer/resale
    Constant monitoring needed while cooking
    Activewear isn't office-appropriate
    Inefficient last-mile delivery in cities
    Energy management in commercial buildings
    Cheap/comfortable home office equipment
    Homes are drafty and cold
    Meal replacement shakes aren't filling
    Monitoring of wildfire smoke pollution
    Excessive product packaging waste
    Planning unique/creative dates is hard
    Climbing equipment is expensive
    Dish soap doesn't cut through grease
    Protein powder doesn't mix well
    Shipping restrictions limit package contents
    Data center cooling in water-scarce areas
    Parking meter payment restrictions
    WFH procrastination and distractions
    Athletic socks slip down
    ID verification is time-consuming & scary
    Air fresheners smell artificial
    Kitchen gadgets are hard to use
    Smartwatches irritate the skin
    Management of agricultural water usage
    Organ transplant rejection risk
    Meeting friends online feels unsafe
    Ensuring kids meet nutrition guidelines
    Language barriers when traveling
    Public soccer fields are limited
    Building a habit of networking
    Dress pants lose shape quickly
    Inadequate water quality monitoring
    Inefficient management of chronic diseases
    Staying motivated to exercise alone
    Inefficient lost and found systems
    Delays & mistakes with package shipping
    Inadequate monitoring of forest biodiversity
    Eco-friendly products don't always last
    Art/music therapy is hard to access
    Granola bars are too sugary
    Consistent personal branding is hard
    High carbon footprint of small factories
    Stroke recovery requires intense rehab
    Autonomous vehicle hacking vulnerability
    Pro makeup tools are expensive
    Plants die from irregular watering
    Energy management in data centers
    Self-driving cars assessing unpredictability
    Language barriers complicate trip planning
    Garbage bags tear easily
    Toilet cleaners have strong chemicals
    Remembering consistent mindfulness
    Inefficient management of construction waste
    Eco-friendly home upgrades are expensive
    Swimwear fades from chlorine
    Access to clean water in developing areas
    Premium athleisure wear is expensive
    Fitness trackers are inaccurate
    Furniture doesn't fit odd-shaped rooms
    Finding quality public speaking techniques
    Tracking personal goals/habits is hard
    Home alarms are easily triggered
    Unaffordable housing in urban slums
    Licensed art/music therapists are scarce
    Meaningful DEI initiatives hard to sustain
    Cleaners leave surfaces still dirty
    Low-calorie ice cream isn't creamy
    DIY projects often go wrong
    Hair treatments damage hair over time
    Purebred cats have health issues
    Travel pillows don't help neck pain
    Inefficient management of textile waste
    Easily lost or stolen tickets
    Professional CBT is expensive
    Pet beds get smelly quickly
    Patio furniture rusts quickly
    Challenging lost item ownership verification
    Inefficient crop monitoring in agriculture
    Expensive high-performance car upgrades
    Screen time concerns for child development
    Instant noodles lack nutrition
    Camping gear is bulky to pack
    Employee training is inconsistent
    Oven cleaners are toxic
    Monitoring of bridge structural health
    Design materials harm the environment
    Pro hair tools are expensive
    Flavored water has artificial taste
    Quality control is inconsistent
    Electric car charging stations limited
    Cleaning sprays have harsh smells
    Dishwasher tablets leave residue
    Keto snacks are high in calories
    Veggie chips aren't actually healthy
    Energy management in electric vehicles
    Easily lost or damaged receipts
    Messy/time-consuming planner updates
    Single-use items create lots of trash
    Overstocking/understocking inventory
    Vision/mobility impairment with age
    Specialized outdoor features hard to find
    Carpet cleaners leave residue
    Ticket scalping inflates prices
    Works by top artists have limited availability
    Inefficient waste heat recovery in industries
    Inefficient management of agricultural pests
    Inefficient management of food waste
    Multiple medication management
    Proof of purchase needed for warranties
    Access to healthcare for homeless individuals
    Orthopedic shoes look unattractive
    Edtech is expensive for schools
    Select the problem that is most closely related to the business concept or idea.
    
    Market Segment Matching:
    Please select a market segment from the following list that is closest to the user input:
    Sustainable Packaging Alternatives
    Sustainable Packaging Solutions
    Eco-Friendly Packaging Solutions
    Sustainable and Eco-Friendly Solutions
    Ergonomic Workplace Solutions
    Sustainable Fashion and Textiles
    Remote Work Ergonomic Solutions
    Sustainable Fashion & Upcycled Clothing
    Sustainable Living Products
    Accessibility and Adaptive Products
    Senior Living and Mobility Aids
    Personal Safety and Emergency Preparedness
    Water Conservation and Purification Products
    Digital Learning and Educational Technology
    Sustainable Outdoor and Adventure Gear
    Home Office Furniture and Accessories
    Sustainable Home Cleaning
    Indoor Recreation Equipment
    Remote Work and Home Office Equipment
    Digital Content Creation Tools
    Water Conservation and Recycling Products
    Senior Care and Aging-in-Place Solutions
    Indoor Gardening/Hydroponics
    Travel-Sized Products and Accessories
    Eco-Friendly Cleaning Products
    Personal Safety Devices
    Organic produce delivery
    Sustainable Agriculture and Gardening
    Dog Food
    Eco-friendly Pet Products
    Pet Tech and Smart Products
    Learning Tools and Courses
    Metalworking and Blacksmithing Equipment
    Plus-size fashion
    Indoor Vertical Gardening Systems
    Reusable & Sustainable House Products
    Home Spa and Relaxation Products
    Air Purification Systems
    Gourmet/Specialty Food Products
    Home Gym Equipment
    Workwear and professional attire
    Sustainable Transportation Solutions
    Motorcycle Gear and Accessories
    Outdoor Recreation and Adventure Gear
    Smart Home Devices and Automation
    Beverages
    Cat Food
    Home Energy Management Systems
    Digital Nomad & Portable Office Gear
    Parenting and Baby Care Products
    3D Printing Supplies and Equipment
    Natural/Organic Beauty Products
    Maternity and Nursing Products
    Car Accessories & Maintenance Products
    Circular Economy Products 
    Outdoor Furniture
    Foraging and Wildcrafting Tools
    Men's Grooming Products
    Swimwear and Accessories
    Micro-mobility Products
    Electric Vehicle Accessories and Charging
    Vegan and plant-based foods
    Biohacking and Human Enhancement Products
    Fast Fashion
    Home Organization & Storage Solutions
    Circular Economy and Upcycled Products
    Outdoor Furniture
    Customizable Gear & Accessories
    Spirits and Liquors
    Specialty Food/Bev Dietary Products
    Mattresses
    Baby and Toddler Gear
    Party Supplies
    Tech Wellness and Digital Detox
    Crafting Supplies
    Home Automation and Security Systems
    Home Audio Systems
    Mental Health and Wellness Products
    DIY Home Improvement Tools
    Specialty Coffee and Tea Equipment
    Beekeeping Supplies
    Essential Oils
    Home Diagnostics and Health Monitoring
    Home Air Quality Monitoring Products
    Functional beverages (e.g., nootropics, adaptogens)
    Pet Care and Tech Products
    Plant-based Protein Alternatives & Supplies
    Gluten-free bakeries
    Modular Furniture for Small Spaces
    PC Gaming Hardware
    Travel Accessories
    VR Headsets
    Functional Foods and Beverages
    Plant-Based and Alternative Food Products
    Virtual and Augmented Reality Technology
    Gaming Consoles
    Baking Mixes
    Electric Bikes
    Outdoor Adventure Gear
    Upcycled and Repurposed Items
    Home Energy Management Systems
    Bird Supplies
    Styling Tools
    Vaping and E-cigarette Products
    Blockchain and Cryptocurrency Hardware
    Board Games
    Mobile Device Accessories
    Swimwear
    Fishing Boats
    Fishing Gear
    Personalized and Custom Gift Items
    Healthy Snack Foods
    Home Gym Equipment
    Protein powder and supplement retailers
    Woodworking Tools and Supplies
    Freeze-dried camping meals
    Artisanal and Handmade Goods
    Drone and RC Vehicle Equipment
    Golf Equipment
    Artisanal cheese shops
    Bohemian/Hippie chic
    Tennis Equipment
    Virtual and Augmented Reality Applications
    Water Sports Equipment
    Wearable Technology
    Hair Color
    Travel Gear
    Makeup Products
    At-home Diagnostic and Health Monitoring
    Athleisure Clothing
    Home Security Systems
    Local farm-to-table produce boxes
    Luxury Makeup
    Board Games
    Zero-waste Lifestyle Products
    Fitness Equipment
    Personalized Beauty and Skincare Systems
    Luxury Outerwear
    Mindfulness and Meditation Aids
    Portable Audio
    Portable Food & Drink
    VR Accessories
    Water Sports Equipment
    Nail Products
    Personalized Nutrition & Supplement Kits
    Action Figures
    Casual Shoes
    Currency Collecting
    Digital Detox and Wellness Products
    Portable Food & Drink
    Sleep Optimization Products
    Educational Toys
    Water Filtration Products
    Select the market segment that is most appropriate and aligns closely with the business concept or idea.
    
    Output Format:
    [Closest Problem Statement from List]
    [Closest Market Segment from List]
    
    Illustrative Examples:
    Input: 
    organic soda brand
    Output: 
    {
      problem: Juice contains too much sugar,
      market: Beverages
    }
    Input: 
    Comfortable and stylish bucket hats for men
    Output: 
    {
      problem: Trendy clothes are low-quality,
      market: Sustainable Fashion and Textiles
    }
    Input: 
    A sleep mask that keeps you cool while blocking out light
    Output: 
    {
      problem: Noise makes it hard to sleep,
      market: Sleep Optimization Products
    }
    Input: 
    Eco-friendly bamboo toothbrush that helps reduce plastic waste
    Output: 
    {
      problem: Toothpaste doesn't whiten effectively,
      market: Reusable & Sustainable House Products
    }
    Input: 
    Organic baby clothing made from soft, chemical-free cotton
    Output: 
    {
      problem: Kids outgrow clothes too fast,
      market: Parenting and Baby Care Products
    }
    
    Additional Guidelines:
    Relevance: Ensure the chosen problem directly relates to the core function or benefit of the business concept.
    Also, Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Also, ensure that the problem and market should be selected from the given list and strictly do not recommend any other problem or market which is not available in the list
    Strictly ensure that you return only the required JSON parsable response and nothing else and the strings should be in quotes`,
    PRODUCTIZATION: `Objective:
    Transform user-provided problem statements and market segments into refined business opportunities that address specific consumer pain points through direct observation. The transformed business opportunities must solve the identified problem and compete effectively in the provided market segment by addressing key pain points and improving user experience.
    
    Input:
    A problem statement
    A market segment
    
    Step 1: Analyze Consumer Pain Points
    Identify existing products that solve or attempt to solve the problem within the specified market segment.
    Conduct a thorough review of user interactions with these products, focusing on:
    User complaints and feedback (from online reviews, forums, social media, etc.)
    Inefficiencies or frustrations users experience while using these products
    Any observable patterns of dissatisfaction or recurring issues
    Step 2: Conduct Direct Observation
    Simulate or conduct real-world observations of users interacting with existing products to gain firsthand insights into their experiences.
    Note specific actions or tasks that seem to cause frustration or inefficiency.
    Identify any unmet needs or areas where the current products fall short.
    Step 3: Identify Key Pain Points
    Synthesize the findings from the user feedback and direct observations to pinpoint the most significant pain points users face.
    Prioritize these pain points based on their frequency and impact on the user experience.
    Step 4: Develop a Solution
    Brainstorm potential product ideas that directly address the identified pain points.
    Ensure the proposed product idea:
    Provides a tangible solution to the key pain points
    Improves user experience and satisfaction
    Offers a clear competitive advantage over existing products
    Step 5: Create Business Description
    Develop a unique and compelling business description that highlights how the proposed product solves the identified pain points.
    
    Output:
    Format the output to include:
    Business Overview: A 3-5 word description of the core concept.
    Business Description: A one-sentence concise description including:
    Unique distribution approach/strategy
    Core feature/functionality
    Specific audience
    Distribution Problem Description: The first sentence will describe the specific pain points with existing products, based on user feedback and direct observation. The second sentence will explain how the proposed concept directly addresses these pain points.
    Problem: Problem solved (from user input)
    Market Segment: Relevant market segment (from user input)
    
    Example Outputs:
    
    User input: 
    Trendy clothes are low-quality
    Sustainable Fashion and Textiles
    Output:
    {
      idea: "Durable Eco-Friendly Jeans",
      description: "High-quality, fashionable jeans made from sustainable materials, featuring reinforced stitching and eco-friendly dyes to ensure longevity and minimal environmental impact.",
      strategy: ["Trendy jeans often lack durability, leading to frequent replacements and contributing to waste.", "The proposed solution offers fashionable, durable jeans made with reinforced stitching and eco-friendly dyes, ensuring they last longer and reduce environmental impact."],
      problem: "Trendy clothes are low-quality",
      market: "Sustainable Fashion and Textiles",
    }

    User input: 
    Noise makes it hard to sleep
    Sleep Optimization Products
    Output:
    {
      idea: "Adaptive Sleep Noise Machine",
      description: "A smart sound machine that uses AI to monitor and adjust white noise and soothing sounds based on real-time ambient noise levels and user sleep patterns, providing a personalized sleep environment.",
      strategy: ["Existing sound machines offer limited customization and do not adapt to changing noise levels, leading to suboptimal sleep conditions." ,"The proposed solution is an AI-powered sound machine that continuously monitors and adjusts white noise and soothing sounds based on real-time ambient noise levels and user sleep patterns, ensuring a consistent and optimal sleep environment."],
      problem: "Noise makes it hard to sleep",
      market: "Sleep Optimization Products",
    }    
    
    User Input:
    Juice contains too much sugar
    Beverages
    Output:
    {
      idea: "Low-Sugar Green Juice",
      description: "A natural, low-sugar green juice blend featuring kale, spinach, and cucumber, sweetened with monk fruit and stevia, offering a healthy and refreshing beverage option for health-conscious consumers.",
      strategy: ["Traditional green juices contain high amounts of sugar, leading to health concerns for consumers.", "The proposed solution offers a natural green juice blend made from kale, spinach, and cucumber, sweetened with monk fruit and stevia, providing a healthy and low-sugar alternative without compromising on taste."],
      problem: "Juice contains too much sugar",
      market: "Beverages",
    }
    Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Strictly ensure that you return only the required JSON parsable response and nothing else`,
    DISTRIBUTION: `Objective: Transform user-provided problem statements and market segments into refined business opportunities by analyzing patents and recent innovations within the industry. The transformed business opportunities should always be unique in the market segment while solving the identified problem and competing effectively by addressing key gaps and emerging trends identified through patent analysis.
    Input:
    A problem statement
    A market segment
    Step 1: Analyze Industry Patents and Innovations
    Identify recent patent filings and innovations within the specified market segment.
    Conduct a thorough review of patent databases and industry reports, focusing on:
    Areas with significant recent activity and innovation
    Emerging trends and technologies
    Gaps in the market where competitors are not focusing
    Opportunities for unique or novel concepts
    Step 2: Synthesize Findings
    Analyze the collected data to pinpoint specific areas of opportunity.
    Identify technologies or product features that are gaining traction.
    Recognize gaps in the market where innovation is lacking.
    Determine how emerging trends can be leveraged to create unique product offerings.
    Step 3: Identify Key Opportunities
    Synthesize the findings to pinpoint the most significant opportunities for innovation.
    Prioritize these opportunities based on their potential impact on the market and feasibility of implementation.
    Step 4: Develop a Solution
    Brainstorm potential product ideas that directly address the identified opportunities.
    Ensure the proposed product idea:
    Leverages recent innovations and trends
    Provides a tangible solution to a key market gap
    Offers a clear competitive advantage over existing products
    Step 5: Create Business Description
    Develop a unique and compelling business description that highlights how the proposed product leverages patent findings and addresses market gaps.
    Output: Format the output to include:
    Business Overview:
    A 3-5 word description of the core concept.
    Business Description:
    A one-sentence concise description including:
    Unique approach/strategy
    Core feature/functionality
    Specific audience
    Opportunity Description:
    The first sentence will describe the specific gaps or trends identified through patent and innovation analysis. The second sentence will explain how the proposed concept directly addresses these opportunities.
    Problem:
    Problem solved (from user input).
    Market Segment:
    Relevant market segment (from user input).
    
    Example Outputs:
    
    User input: 
    Traditional gardening tools are outdated.
    Home Improvement
    Output:
    {
      idea: "Automated Garden Tools",
      description: "An automated garden maintenance system that uses AI and smart sensors to care for plants, targeting tech-savvy home gardeners.",
      strategy: ["Recent patents reveal a surge in smart home device innovations, but a lack of innovation in smart gardening tools. The proposed solution offers an AI-driven garden maintenance system with smart sensors, filling this gap and modernizing gardening tools."],
      problem: "Traditional gardening tools are outdated.",
      market: "Home Improvement",
    }
        
    User input: 
    Home fitness equipment is bulky and hard to store.
    Fitness Equipment
    Output:
    {
      idea: "Foldable Fitness Gear",
      description: "A range of compact, foldable home fitness equipment designed for easy storage and convenience, targeting urban dwellers with limited space.",
      strategy: ["Analysis of recent patents shows a focus on compact and multi-functional home fitness equipment, but few solutions address storage issues.", "The proposed solution offers foldable fitness gear that is easy to store, catering to urban dwellers with limited space."],
      problem: "Home fitness equipment is bulky and hard to store.",
      market: "Fitness Equipment",
    }    
    
    User Input:
    Outdoor gear is often not eco-friendly.
    Outdoor Gear
    Output:
    {
      idea: "Sustainable Hiking Gear",
      description: "A line of eco-friendly hiking gear made from recycled materials, offering durable and sustainable options for environmentally-conscious adventurers.",
      strategy: ["Patent analysis reveals growing interest in sustainable materials but limited application in outdoor gear.", "The proposed solution offers a line of eco-friendly hiking gear made from recycled materials, addressing the need for sustainable outdoor equipment."],
      problem: "Outdoor gear is often not eco-friendly.",
      market: "Outdoor Gear",
    }
    
    Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Strictly ensure that you return only the required JSON parsable response and nothing else`,
    DOMINATE_NICHE: `Objective: Transform user-provided problem statements and market segments into refined business opportunities by identifying emerging trends and market shifts. The transformed business opportunities should always be unique in the market segment while solving the identified problem and competing effectively by aligning with consumer behavior, technological advancements, and cultural shifts. The business opportunity should always be described as a very specific and novel product that does not currently exist at scale.

    Consider trends such as:
    Trending sports like pickleball, alpine touring, fat-biking, outdoor water sports, virtual and non-virtual golfing, snowboarding, trail running, tennis, surfing, kayaking, indoor and outdoor climbing, fishing, paddleboarding
    Trending culinary practices, beverages and foods like Urban Farm Produce, Climate-Conscious ingredients, pasture-raised dairy, meat & eggs, simple whole ingredients, alternative and healthy deserts, exotic fruits, exotic smoothie ingredients, clean labels, non-alcoholic beers, wines and seltzers, healthy juices, fermented drinks, coffee cocktails, zero-sugar drinks, premium beverages, naturally beneficial beverages, enhanced beverages
    Trends in apparel and fashion like reimagined denim products, sheer clothing, sustainable fashion, gender neutral clothing, smart clothing, minimalism, fringe, customizable fashion, cozy and bold comfort clothes
    Trends in personal care like personalization with AI, natural and organic ingredients, biotech innovations leading to beauty products, male beauty products, at home treatments, premium products, preventative products
    trends in home care and cleaning like simple and easy to use products, products without microplastics or harmful ingredients, transparent labeling, professional cleaning products for every day consumers
    Trends in baby and childcare products like smart devices, educational and engaging toys, all-in-one solutions like a combined crib and baby monitor, replicating adult beauty and self care routines for children and babies, multi-functional products, characterized or uniquely shaped products, environmentally friendly products
    Trends in pet care like smart pet technology, personalized nutrition, ongoing pet wellness and maintenance, niche pet lover products like pet photography, pet dating, pet parties, telemedicine for your pet
    The Miniaturization of electronics
    The embedding of artificial intelligence into every day consumer physical products
    Trends in OTC medicinal products such as natural and organic products, private label brands, monthly subscription services, stress and anxiety prevention and maintenance
    Anxiety and stress products
    Sleep and wellness products
    
    Input:
    A problem statement
    A market segment
    
    Step 1: Conduct Trend Analysis
    Identify and analyze emerging trends within the specified market segment.
    Conduct a thorough review of:
    Industry reports and publications
    Market research data
    Social media and consumer behavior insights
    Technological advancements and innovations
    Cultural and societal shifts
    This list of trends:
    Trending sports like pickleball, alpine touring, fat-biking, outdoor water sports, virtual and non-virtual golfing, snowboarding, trail running, tennis, surfing, kayaking, indoor and outdoor climbing, fishing, paddleboarding
    Trending culinary practices, beverages and foods like Urban Farm Produce, Climate-Conscious ingredients, pasture-raised dairy, meat & eggs, simple whole ingredients, alternative and healthy deserts, exotic fruits, exotic smoothie ingredients, clean labels, non-alcoholic beers, wines and seltzers, healthy juices, fermented drinks, coffee cocktails, zero-sugar drinks, premium beverages, naturally beneficial beverages, enhanced beverages
    Trends in apparel and fashion like reimagined denim products, sheer clothing, sustainable fashion, gender neutral clothing, smart clothing, minimalism, fringe, customizable fashion, cozy and bold comfort clothes
    Trends in personal care like personalization with AI, natural and organic ingredients, biotech innovations leading to beauty products, male beauty products, at home treatments, premium products, preventative products
    trends in home care and cleaning like simple and easy to use products, products without microplastics or harmful ingredients, transparent labeling, professional cleaning products for every day consumers
    Trends in baby and childcare products like smart devices, educational and engaging toys, all-in-one solutions like a combined crib and baby monitor, replicating adult beauty and self care routines for children and babies, multi-functional products, characterized or uniquely shaped products, environmentally friendly products
    Trends in pet care like smart pet technology, personalized nutrition, ongoing pet wellness and maintenance, niche pet lover products like pet photography, pet dating, pet parties, telemedicine for your pet
    The Miniaturization of electronics
    The embedding of artificial intelligence into every day consumer physical products
    Trends in OTC medicinal products such as natural and organic products, private label brands, monthly subscription services, stress and anxiety prevention and maintenance
    Anxiety and stress products
    Sleep and wellness products
    Step 2: Synthesize Findings
    Analyze the collected data to identify specific trends and market shifts.
    Recognize changes in consumer behavior and preferences.
    Identify technological advancements that are gaining traction.
    Observe cultural and societal shifts that influence the market.
    Step 3: Identify Key Opportunities
    Synthesize the findings to pinpoint the most significant opportunities for innovation.
    Prioritize these opportunities based on their potential impact on the market and feasibility of implementation.
    Step 4: Develop a Solution
    Brainstorm potential product ideas that directly align with the identified trends.
    Ensure the proposed product idea:
    Leverages emerging trends and market shifts
    Provides a tangible solution to a key market need
    Offers a clear competitive advantage over existing products
    Step 5: Create Business Description
    Develop a unique and compelling business description that highlights how the proposed product aligns with the identified trends and addresses market needs.
    
    
    Output: Format the output to include:
    Business Overview:
    A 3-5 word description of the core concept.
    Business Description:
    A one-sentence concise description including:
    Unique approach/strategy
    Core feature/functionality
    Specific audience
    Opportunity Description:
    The first sentence will describe the specific trends or market shifts identified through trendspotting and market research. The second sentence will explain how the proposed concept directly addresses these opportunities.
    Problem:
    Problem solved (from user input).
    Market Segment:
    Relevant market segment (from user input).
    
    Example Outputs:
    
    User input: 
    Traditional cocktails are inconvenient to prepare and not portable
    Premium Beverages
    Output:
    {
      idea: "Canned Coffee Cocktails",
      description: "Ready-to-drink canned coffee cocktails made with premium coffee and spirits, offering a convenient and portable option for cocktail enthusiasts.",
      strategy: ["The trend towards ready-to-drink and premium beverages is growing, with consumers seeking convenience without compromising on quality.", "The proposed solution offers canned coffee cocktails that combine premium coffee and spirits, providing a convenient and portable option for cocktail enthusiasts looking for a high-quality, ready-to-drink experience."],
      problem: "Traditional cocktails are inconvenient to prepare and not portable",
      market: "Premium Beverages",
    }

    User input: 
    Trail runners need lightweight and durable gear for long-distance running
    Outdoor Gear
    Output:
    {
      idea: "Ultra-Light Trail Running Vest",
      description: "A lightweight, durable trail running vest with integrated hydration system and multiple storage compartments, designed for long-distance runners.",
      strategy: ["The trend towards trail running and ultra-endurance sports is growing, with athletes seeking lightweight and durable gear.", "The proposed solution offers an ultra-light trail running vest with an integrated hydration system and multiple storage compartments, providing essential support for long-distance trail runners."],
      problem: "Trail runners need lightweight and durable gear for long-distance running",
      market: "Outdoor Gear",
    }
    
    User Input:
    Children's toys are often not educational or engaging enough
    Baby and Childcare Products
    Output:
    {
      idea: "AR Science Explorer Kit",
      description: "An augmented reality (AR) science explorer kit featuring interactive lessons and games that teach children about various scientific topics, designed for ages 6-10.",
      strategy: ["The trend towards educational and engaging toys is growing, with parents seeking products that provide meaningful learning experiences.", "The proposed solution offers an AR science explorer kit that includes physical components like cards and models, which, when viewed through a companion app, come to life with interactive AR content, providing an engaging and immersive educational experience for children aged 6-10."],
      problem: "Children's toys are often not educational or engaging enough",
      market: "Baby and Childcare Products",
    }
    
    Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Strictly ensure that you return only the required JSON parsable response and nothing else`,
    PRODUCT_RATING: `Objective: Evaluate a given business idea/concept by rating its product on three different criteria:
    Sophistication and Advanced Nature
    Novelty and Uniqueness
    Suitability for a Specific Group of Customers
    The scores assigned will always be between 80 and 100, never rounded to 0 or 5, and should always be an exact number. The overall rating will be an average of the three criteria scores.
    Note: Despite a spectrum of ranges from 1-100, all ideas will be justified to be between an 80 and 100. All explanations will support these ratings.
    Evaluation Criteria:
    Sophistication and Advanced Nature 1-10: Basic, outdated design, lacks complexity. Examples: Simple household items, basic manual tools. Typical in: Legacy designs, basic household products. 11-20: Slightly better than basic, minimal advancements. Examples: Basic ergonomic designs, simple functional improvements. Typical in: Entry-level kitchen tools, minimal feature enhancements. 21-30: Some advanced features, but mostly standard. Examples: Improved materials, basic automation. Typical in: Standard home appliances, basic garden tools. 31-40: Moderately sophisticated, includes some modern features. Examples: Integrated smart sensors, moderate use of innovative materials. Typical in: Modern kitchen gadgets, smart home basics. 41-50: Fairly advanced, has noticeable improvements. Examples: Enhanced functionalities, basic smart features. Typical in: High-quality fitness equipment, advanced kitchen tools. 51-60: Advanced, incorporates recent trends. Examples: Real-time data feedback, advanced safety features. Typical in: Modern exercise equipment, advanced home security systems. 61-70: Highly sophisticated, uses cutting-edge materials and design. Examples: AI-powered functionalities, complex ergonomic designs. Typical in: Innovative fitness devices, high-tech home appliances. 71-80: Very advanced, close to the latest innovations. Examples: Advanced automation, real-time monitoring tools. Typical in: Top-tier home exercise equipment, sophisticated kitchen appliances. 81-90: Extremely sophisticated, pushes product boundaries. Examples: Advanced AI integration, state-of-the-art ergonomic designs. Typical in: Leading-edge medical devices, innovative health and wellness products. 91-100: Top-tier sophistication, leading-edge and pioneering. Examples: Quantum technology applications, pioneering AR/VR integration in physical products. Typical in: Cutting-edge research tools, next-gen consumer products.
    Novelty and Uniqueness 1-10: Very common, no unique aspects. Examples: Basic utensils, simple storage solutions. Typical in: Over-saturated markets, generic household items. 11-20: Slightly uncommon, minor unique elements. Examples: Slight design tweaks, minor functional improvements. Typical in: Basic gadgets with minor customizations, entry-level variations. 21-30: Some unique features, but largely similar to existing products. Examples: Unique branding, specific but minor design enhancements. Typical in: Moderately differentiated kitchen tools, common home decor items. 31-40: Moderately unique, stands out in some aspects. Examples: Unique materials, several distinct features. Typical in: Niche home accessories, specialized gardening tools. 41-50: Fairly unique, distinct in several ways. Examples: Multiple innovative features, unique selling propositions. Typical in: Mid-range differentiated home appliances, distinct personal care products. 51-60: Unique, has multiple innovative elements. Examples: Patented designs, original functional models. Typical in: High-end kitchen gadgets, advanced personal fitness equipment. 61-70: Highly unique, noticeable differentiation. Examples: Breakthrough features, significantly different user experience. Typical in: Premium personal care tools, highly specialized kitchen devices. 71-80: Very unique, rarely seen in the market. Examples: Novel materials, market-disrupting designs. Typical in: Emerging market gadgets, innovative fitness solutions. 81-90: Extremely unique, groundbreaking. Examples: Revolutionary ideas, major industry shifts. Typical in: Top-tier innovative household products, groundbreaking personal care tools. 91-100: One-of-a-kind, highly innovative and original. Examples: First-of-its-kind designs, unprecedented market entries. Typical in: Market leaders, pioneering physical products.
    Suitability for a Specific Group of Customers 1-10: Generic, no specific target audience. Examples: Mass-market products, no customization. Typical in: General consumer items, undifferentiated household products. 11-20: Vaguely defined audience, broad applicability. Examples: Basic segmentation, broad appeal. Typical in: General personal care items, basic household tools. 21-30: Somewhat targeted, but still general. Examples: Broad demographic targeting, general marketing strategies. Typical in: Widely applicable home gadgets, broad utility items. 31-40: Moderately targeted, identifiable audience. Examples: Specific age groups, general industry applications. Typical in: Targeted kitchen tools, industry-specific products. 41-50: Fairly targeted, clear customer segment. Examples: Well-defined demographics, focused marketing. Typical in: Mid-market home appliances, specialized personal care products. 51-60: Well-targeted, specific customer base. Examples: Niche market segments, specific consumer needs. Typical in: Premium fitness equipment, targeted home solutions. 61-70: Highly targeted, well-defined niche market. Examples: Highly specific customer needs, specialized markets. Typical in: High-end niche household items, bespoke personal gadgets. 71-80: Very targeted, strong focus on a particular group. Examples: Highly specialized demographics, unique market needs. Typical in: Ultra-niche kitchen gadgets, highly specialized home tools. 81-90: Extremely targeted, highly specialized audience. Examples: Very specific customer profiles, unique market segments. Typical in: Top-tier niche markets, exclusive household products. 91-100: Perfectly targeted, exceptionally well-suited for a specific group. Examples: Custom-built solutions, perfectly matched to customer needs. Typical in: Ultra-premium physical products, bespoke consumer goods.
    Output Format: Provide the scores in the following format:
    Sophistication Score: [Exact Score] One sentence description of the score.
    Unique Score: [Exact Score] One sentence description of the score.
    Audience Focus Score: [Exact Score] One sentence description of the score.
    Overall Score: [Average of the three scores]
    Note: Only consider explicitly mentioned advancements or features.

    Illustrative Examples: 
    Input: 
    A cutting-edge blender with advanced blending technology and smart sensors to optimize blending consistency based on ingredient type 
    Output:
    {
      "Sophistication Score": 88,
      "sophisticationDescription": "The blender uses advanced blending technology and smart sensors, showcasing high sophistication and modern features.",
      "Unique Score": 85,
      "uniqueScoreDescription": "Incorporating smart sensors to optimize blending consistency is a unique feature not commonly seen in blenders.",
      "Audience Focus Score": 86,
      "audienceFocusScoreDescription": "The blender is exceptionally well-suited for health enthusiasts and home chefs looking for precise blending options.",
      "Overall Score": 86
    }

    Input: 
    A subscription service offering a curated selection of artisanal cheeses delivered monthly, with detailed tasting notes and pairing suggestions 
    Output:
    {
      "Sophistication Score": 83,
      "sophisticationDescription": "The service uses a sophisticated selection process and offers detailed tasting notes and pairing suggestions, enhancing the customer experience",
      "Unique Score": 87,
      "uniqueScoreDescription": "Curating artisanal cheeses with pairing suggestions is a highly unique feature, providing a distinct experience for cheese lovers.",
      "Audience Focus Score": 85,
      "audienceFocusScoreDescription": "The service is well-suited for food enthusiasts and gourmet lovers, targeting a specific customer base.",
      "Overall Score": 85 
    }
    
    Input: A high-tech suitcase with built-in GPS tracking, biometric locks, and a built-in power bank for charging devices on the go 
    Output:
    {
      "Sophistication Score": 90,
      "sophisticationDescription": "The suitcase integrates advanced GPS tracking, biometric locks, and a power bank, showcasing high sophistication and modern technology.",
      "Unique Score": 88,
      "uniqueScoreDescription": "Combining GPS tracking, biometric locks, and a power bank in a suitcase is a highly unique and innovative feature set.",
      "Audience Focus Score": 87,
      "audienceFocusScoreDescription": "The suitcase is well-suited for frequent travelers and tech-savvy individuals seeking enhanced security and convenience.",
      "Overall Score": 88
    }

    Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Strictly ensure that you return only the required JSON parsable response and nothing else`,
  },
  PRODUCT_RATING: `Objective:
  Evaluate a given business idea/concept by rating its product on three different criteria:
  Sophistication and Advanced Nature
  Novelty and Uniqueness
  Suitability for a Specific Group of Customers
  The scores assigned will always be between 80 and 100, never rounded to 0 or 5, and should always be an exact number. The overall rating will be an average of the three criteria scores. 
  
  Note: despite a spectrum of ranges from 1-100, all idea will be justified to be between an 80 and 100. All explanations will support these ratings.
  
  Evaluation Criteria:
  
  Sophistication and Advanced Nature
  1-10: Basic, outdated technology, lacks complexity.
  Examples: Simple static websites, basic CRUD (Create, Read, Update, Delete) applications.
  Typical in: Legacy systems, basic informational websites.
  11-20: Slightly better than basic, minimal advancements.
  Examples: Basic responsive design, simple form-based web apps.
  Typical in: Entry-level web apps, minimal interactive features.
  21-30: Some advanced features, but mostly standard.
  Examples: Basic APIs, simple data integration.
  Typical in: Standard enterprise web applications, basic SaaS tools.
  31-40: Moderately sophisticated, includes some modern technology.
  Examples: Integrated cloud services, moderate use of JavaScript frameworks.
  Typical in: Modern CMS (Content Management Systems), basic e-commerce platforms.
  41-50: Fairly advanced, has noticeable improvements.
  Examples: Enhanced user interfaces, basic machine learning models.
  Typical in: High-quality mobile apps, advanced e-commerce platforms.
  51-60: Advanced, incorporates recent technology trends.
  Examples: Real-time data updates, advanced security features.
  Typical in: Modern SaaS platforms, advanced web applications.
  61-70: Highly sophisticated, uses cutting-edge technology.
  Examples: AI-powered features, complex data analytics.
  Typical in: Innovative mobile apps, high-tech web platforms.
  71-80: Very advanced, close to the latest innovations.
  Examples: Advanced machine learning models, real-time collaboration tools.
  Typical in: Top-tier productivity apps, sophisticated marketplace platforms.
  81-90: Extremely sophisticated, pushes technological boundaries.
  Examples: Advanced AI integration, state-of-the-art UX/UI.
  Typical in: Leading-edge fintech apps, innovative health tech platforms.
  91-100: Top-tier sophistication, leading-edge and pioneering.
  Examples: Quantum computing applications, pioneering AR/VR integration.
  Typical in: Cutting-edge research tools, next-gen technology startups.
  
  Novelty and Uniqueness
  1-10: Very common, no unique aspects.
  Examples: Basic to-do list apps, simple blog platforms.
  Typical in: Over-saturated markets, generic software solutions.
  11-20: Slightly uncommon, minor unique elements.
  Examples: Slight design tweaks, minor unique functionalities.
  Typical in: Basic apps with minor customizations, entry-level market variations.
  21-30: Some unique features, but largely similar to existing products.
  Examples: Unique branding, specific but minor feature enhancements.
  Typical in: Moderately differentiated SaaS tools, common marketplace platforms.
  31-40: Moderately unique, stands out in some aspects.
  Examples: Unique user interfaces, several distinct features.
  Typical in: Niche productivity apps, specialized content platforms.
  41-50: Fairly unique, distinct in several ways.
  Examples: Multiple innovative features, unique selling propositions.
  Typical in: Mid-range differentiated web apps, distinct service platforms.
  51-60: Unique, has multiple innovative elements.
  Examples: Patented algorithms, original service models.
  Typical in: High-end SaaS products, advanced market-specific platforms.
  61-70: Highly unique, noticeable differentiation.
  Examples: Breakthrough features, significantly different user experience.
  Typical in: Premium productivity tools, highly specialized service platforms.
  71-80: Very unique, rarely seen in the market.
  Examples: Novel technologies, market-disrupting innovations.
  Typical in: Emerging market apps, innovative B2B solutions.
  81-90: Extremely unique, groundbreaking.
  Examples: Revolutionary ideas, major industry shifts.
  Typical in: Top-tier innovative software, groundbreaking industry platforms.
  91-100: One-of-a-kind, highly innovative and original.
  Examples: First-of-its-kind technology, unprecedented market entries.
  Typical in: Market leaders, pioneering software products.
  
  Suitability for a Specific Group of Customers
  1-10: Generic, no specific target audience.
  Examples: Mass-market apps, no customization.
  Typical in: General consumer apps, undifferentiated web services.
  11-20: Vaguely defined audience, broad applicability.
  Examples: Basic segmentation, broad appeal.
  Typical in: General productivity tools, basic consumer apps.
  21-30: Somewhat targeted, but still general.
  Examples: Broad demographic targeting, general marketing strategies.
  Typical in: Widely applicable SaaS tools, broad enterprise solutions.
  31-40: Moderately targeted, identifiable audience.
  Examples: Specific age groups, general industry applications.
  Typical in: Targeted consumer apps, industry-specific software.
  41-50: Fairly targeted, clear customer segment.
  Examples: Well-defined demographics, focused marketing.
  Typical in: Mid-market enterprise tools, specialized consumer apps.
  51-60: Well-targeted, specific customer base.
  Examples: Niche market segments, specific business sectors.
  Typical in: Premium SaaS products, targeted industry solutions.
  61-70: Highly targeted, well-defined niche market.
  Examples: Highly specific customer needs, specialized industries.
  Typical in: High-end niche apps, bespoke enterprise solutions.
  71-80: Very targeted, strong focus on a particular group.
  Examples: Highly specialized demographics, unique market needs.
  Typical in: Ultra-niche productivity tools, highly specialized B2B platforms.
  81-90: Extremely targeted, highly specialized audience.
  Examples: Very specific customer profiles, unique market segments.
  Typical in: Top-tier niche markets, exclusive SaaS products.
  91-100: Perfectly targeted, exceptionally well-suited for a specific group.
  Examples: Custom-built solutions, perfectly matched to customer needs.
  Typical in: Ultra-premium software products, bespoke industry platforms.
  
  Output Format:
  Provide the scores in the following format:
  {
    "Sophistication Score": [Exact Score],
    "sophisticationDescription": One sentence description of the score.,
    "Unique Score": [Exact Score],
    "uniqueScoreDescription": One sentence description of the score.,
    "Audience Focus Score": [Exact Score],
    "audienceFocusScoreDescription": One sentence description of the score.,
    "Overall Score": [Average of the three scores]
  }
  
  Note: Only consider explicitly mentioned advancements or features.
  
  Illustrative Examples:
  Input:
  An app that integrates with gym equipment to reserve machines and optimize workout plans based on real-time availability and user goals
  Output: {
    "Sophistication Score": 85,
    "sophisticationDescription": "The app uses real-time data integration and machine optimization, which involves advanced technology and innovative use of IoT.",
    "Unique Score": 80,
    "uniqueScoreDescription": "Integrating with gym equipment to optimize workout plans based on real-time availability is a highly unique feature not commonly seen in fitness apps.",
    "Audience Focus Score": 85,
    "audienceFocusScoreDescription": "The app is exceptionally well-suited for fitness enthusiasts and gym-goers looking for a more efficient workout experience.",
    "Overall Score": 83
  }

  Input:
  A subscription service offering a library of immersive VR historical experiences, with historically accurate content and social experiences
  Output: {
    "Sophistication Score": 90,
    "sophisticationDescription": "The service uses cutting-edge VR technology and offers an advanced level of immersion and interactivity.",
    "Unique Score": 91,
    "uniqueScoreDescription": "Providing historically accurate VR experiences with social interaction is an innovative and unique offering in the educational and entertainment sectors.",
    "Audience Focus Score": 86,
    "audienceFocusScoreDescription": "The service is well-suited for history enthusiasts and educators seeking immersive learning tools, targeting a specific customer base.",
    "Overall Score": 89
  }
  
  Input:
  A platform that allows parents to upload a sample of their voice and picture that AI turns into a child YouTube video, so it feels like they are the star of the video and teaching their own children
  Output: {
    "Sophistication Score": 83,
    "sophisticationDescription": "The platform uses extremely sophisticated AI for personalized video creation, pushing the boundaries of current AI capabilities.",
    "Unique Score": 94,
    "uniqueScoreDescription": "The concept is extremely unique and groundbreaking, offering highly personalized educational content for children.",
    "Audience Focus Score": 89,
    "audienceFocusScoreDescription": "The platform is exceptionally well-suited for parents wanting to create personalized educational content for their children, making it highly targeted.",
    "Overall Score": 89
  }
  Additional Guidelines:
  Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
  Strictly ensure that you return only the required JSON parsable response and nothing else`,
};

export const SYSTEM_IDEA_VALIDATION = {
  BUSINESS_TYPE_SELECTOR: `I will provide you with a description of a business idea, and your task is to classify it as either a "tech" or an "ecommerce"
  A "tech" involves the development or utilization of software, applications, platforms, or digital services as the primary product or service.
  An "ecommerce" involves the buying and selling of goods or services over the internet, focusing primarily on the commercial transaction of physical or digital products.
  Additional Guidelines:
  Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
  Strictly ensure that you return only the required JSON parsable response and nothing else`,
  TECH_PRODUCT: `Step 1: The assistant will make minor language modifications to the user input without losing any content or context. It will ensure the business idea sounds professional and well-articulated. It will never add new components to the business idea and use similar language to that used in the user input. The description will always be 140 characters or less.

    Step 2: The assistant will describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. It will also provide the market segment chosen from the list in a separate line below the idea. It will never add core differentiating features or new concepts that are not included in the user input.
    
    Step 3: Then, the assistant will generate a simplified description of business idea in 6 words or less. The description should concisely convey the core concept by highlighting its unique value proposition. This will precede the business idea description on its own line.
    
    Step 4: The assistant will map the business idea and description to one of the following problem statements based on its closest fit:
    Cryptocurrency markets are highly volatile and risky
    Accessible education in remote areas is limited
    City parking is expensive and limited in availability
    Education for incarcerated individuals is often limited
    Millennials prefer subscription-based car ownership
    Tailoring clothes for a perfect fit is expensive and time-consuming
    Electric and eco-friendly cars are expensive for consumers
    Frequent doctor visits for chronic issues are inconvenient
    High-demand sports tickets sell out quickly
    Busy professionals seek quick, healthy meal solutions
    Social media often leads to shallow relationships
    Job training for underserved youth is often limited
    Screening for rare diseases is expensive and limited
    Finding reliable and vetted home repair professionals is challenging
    Engaging remote event attendees is challenging
    Accessible transportation in rural areas is limited
    Busy parents want on-demand childcare services
    One-size-fits-all education fails to meet individual needs
    Sports streaming packages are expensive for viewers
    Cryptocurrency exchanges lack robust security measures
    Accessible mental health support is often limited
    Mental health support for seniors is often limited
    Coordinating care for elderly relatives across family members is difficult
    Remote workers seek flexible co-working space rentals
    Difficult to find eco-friendly products for kids
    Limited plus-size options in sustainable fashion
    Finding reliable and vetted personal fitness trainers is challenging
    Gen Alpha expects gamified educational content
    Limited sustainable options for baby products
    Managing digital assets and passwords after death is complex
    Online classes can be disengaging for many students
    Dating platforms often enable harassment of users
    Finding size-inclusive clothing rental options is limited
    Freelancers need project-based health insurance options
    Purebred dogs are expensive to purchase and maintain
    Outdoor enthusiasts seek sustainable gear options
    Online therapy lacks the human connection of in-person sessions
    Finding reliable and vetted home organizers is time-consuming
    Finding reliable and vetted tutors for specific subjects is time-consuming
    Finding ethical and sustainable fashion options is time-consuming
    Limited mental health resources for minority groups
    Working parents need flexible, on-demand pet care services
    Coordinating shared childcare for non-traditional work schedules is difficult
    Finding reliable and vetted elder care services is challenging
    Parents want kid-safe social media platforms
    Professional-grade cameras are costly for hobbyists
    Wearable devices often have short battery life
    Access to healthcare in rural areas is limited
    Buildings often have high energy consumption rates
    Limited fashion options for plus-size teens
    Limited sustainable menstrual product options
    Finding reliable and vetted personal financial advisors is time-consuming
    Managing personal digital content creation and monetization is disorganized
    Communication with remote teams can be ineffective
    Manual invoice processing is prone to errors
    Interpreting personal health data is often confusing
    Unexpected appliance breakdowns are costly and inconvenient
    Gen Z expects instant, mobile-first customer service
    Gen-Z consumers prefer video content over pictures or text
    Customizing meal plans for specific health conditions is complex
    Limited culturally diverse skin care products
    Managing personal education and skill development plans is disorganized
    Cryptocurrency and DeFi platforms are confusing for newcomers
    Reselling used textbooks is often difficult
    Gen Z prefers mobile-first insurance solutions
    Non-English speakers lack localized streaming content
    Electric cars have limited battery range for long trips
    Busy professionals want on-demand home cleaning
    Coordinating multi-family childcare arrangements is complex
    Energy management in low-income homes is challenging
    Sitting in traffic wastes valuable time
    Continuing education while working full-time is challenging
    Energy management in homes is frequently inefficient
    Coordinating group travel for people with diverse needs is complex
    Gig workers need flexible financial planning tools
    Edtech raises concerns about student data privacy protection
    Low-income areas lack access to fresh produce delivery
    Minimalists seek multi-functional home goods
    Tech-averse seniors need simplified telehealth services
    Concert ticket sites charge excessive processing fees
    Plus-size and inclusive sizing options are limited in fashion
    Clean energy access in off-grid areas is limited
    Dating apps are populated with fake or inactive profiles
    Learning new skills often lacks motivation for self-learners
    Non-tech-savvy users struggle with smart home devices
    Virtual reality gaming equipment is expensive
    Creating custom travel itineraries is time-intensive
    Working mothers need flexible fitness class schedules
    Low-income families lack affordable tutoring services
    Managing personal genetic data and health insights is overwhelming
    Rural areas have limited access to grocery delivery
    Limited fashion options for gender non-conforming individuals
    Business learning tools often lack personalization for users
    Comparing insurance options is confusing for many consumers
    Compatibility between smart home equipment is often limited
    Smart homes raise privacy and security concerns
    Working from home can lead to loneliness and burnout
    Managing personal energy usage and efficiency is cumbersome
    Managing personal legal document archives is disorganized
    Students seek affordable textbook rental options
    Gen Z expects augmented reality shopping experiences
    Non-drivers seek better last-mile transportation solutions
    Organizing and digitizing old family photos is tedious
    Personalizing language learning to individual goals is difficult
    Finding suitable part-time work is challenging
    Cybersecurity threats are increasing in frequency and complexity
    Old buildings have high energy costs for occupants
    Remote work collaboration is challenging for many teams
    Cheating and hacking ruins online gaming experiences
    Data privacy compliance is complex and challenging for companies
    Sensitive data is vulnerable to theft by hackers
    Immigrants struggle to access credit-building services
    Managing personal collections of digital memories and life events is overwhelming
    Mental health support for LGBTQ+ individuals is often limited
    Finding reliable and vetted personal stylists is difficult
    Building trust and deep connections in online communities is difficult
    Managing multiple passwords securely is frustrating for users
    Professional certifications are often prohibitively expensive
    Skiing and snowboarding gear is expensive for casual users
    Mental health support for new mothers is often limited
    LGBTQ+ community seeks inclusive dating apps
    Tracking home maintenance schedules is often overlooked
    Internet connectivity is limited in many rural areas
    Lead generation is often ineffective for many businesses
    Finding reliable and vetted personal chefs for dietary needs is challenging
    Choosing outfits daily is time-consuming
    Managing personal finances is overwhelming for many people
    Energy storage for renewable sources is often inefficient
    Home workout equipment is costly for beginners
    Taking phone calls in noisy places is challenging
    Wedding planning is often stressful and overwhelming
    Carrying multiple payment and loyalty cards is cumbersome
    Tech-savvy seniors seek age-appropriate social platforms
    Coordinating shared ownership and maintenance of community spaces is complex
    Ineffective methods for protecting against in-game cheating and hacks
    High-end smart home devices are prohibitively expensive
    Investment and trading platforms often charge high fees
    Customer data is often fragmented across multiple systems
    Overcoming public speaking anxiety is challenging for many
    Football raises long-term safety and health concerns
    Business intelligence is often fragmented across multiple tools
    Online meditation classes often lack the ambiance of in-person sessions
    Coordinating neighborhood renewable energy initiatives is complex
    Finding culturally appropriate etiquette advice for travelers is difficult
    Quality specialty shoes are expensive for consumers
    Payroll processing is error-prone and time-consuming
    Quality camping gear is expensive for casual campers
    Social media platforms lack robust privacy controls
    Device batteries degrade significantly over time
    Gauging compatibility from online profiles is challenging
    Textbooks are heavy and quickly become outdated
    Air pollution monitoring in cities is often inadequate
    Telemedicine apps can be challenging for seniors to use
    Supply chain visibility is limited for many businesses
    Organizing community sports leagues is administratively burdensome
    Project management often lacks visibility for stakeholders
    Conflicting healthy eating information abounds online
    Controlling multiple smart home devices is complex
    In-game purchases create unfair advantages for players
    Online gaming communities can be toxic for newcomers
    Locating charged micromobility vehicles can be difficult
    Medication effectiveness varies widely between individuals
    Marketing ROI is difficult to measure accurately
    Finding short-term workspace in unfamiliar cities is time-consuming
    Limited adaptive sportswear options for disabled athletes
    Neurodiverse children need adapted learning apps
    Legal services are expensive and intimidating
    Coordinating shared ownership of vacation properties is complex
    Finding reliable and vetted home stagers for real estate is time-consuming
    Non-English speakers need localized financial literacy tools
    Retirees struggle to find part-time job opportunities
    Finding age-appropriate volunteer opportunities for kids is challenging
    Seniors struggle with digital-only banking services
    Challenges in accessing mental health support and therapy
    Customer support is frequently slow and inefficient
    Healthcare access for migrant workers is often limited
    Blockchain technology is difficult for laypeople to understand
    Effective time management is challenging for many individuals
    Professional video equipment is cost-prohibitive
    High-quality drawing tablets are prohibitively expensive
    Visualizing furniture placement before purchasing is difficult
    Niche professional education topics have limited resources
    Understanding sports betting complexities
    Video editing software has a steep learning curve
    Vegans struggle to find suitable meal kit options
    Comparing moving company prices is time-consuming
    Difficult to find teen-friendly banking products and services
    Older generations struggle with cryptocurrency platforms
    Quality backpacking and camping gear is expensive
    Employee engagement is low in many workplaces
    Quality educational tools are expensive for schools
    Cameras are often bulky and prone to damage
    Estate planning is complex and often neglected by individuals
    Managing family medical history across generations is disorganized
    Travelers with disabilities lack accessible booking options
    Finding specific information in user manuals is time-consuming
    PTSD support for veterans is often inaccessible
    Coordinating group gift-giving for special occasions is cumbersome
    Supply chains often lack transparency for consumers
    Clean energy access in developing nations is limited
    Financial services for unbanked populations are limited
    Organizing digital files efficiently is challenging for many users
    Conducting genealogy research is time-consuming and complex
    Tracking and improving sleep patterns is challenging for many
    IT support is frequently overwhelmed in many organizations
    Dating apps lack specific filters for compatibility
    Finding licensed CBT therapists can be challenging
    Gen X prefers desktop-based productivity tools
    Managing multiple rental properties is administratively burdensome
    Parking meter payment options are often restricted
    Navigating busy stadiums and parking lots is frustrating
    High-end skincare products are expensive for consumers
    Live sports event tickets are expensive for fans
    Golf equipment is prohibitively expensive for beginners
    Achieving complex hairstyles often requires a professional
    Professional animal training services are expensive
    Premium personal branding tools have limited availability
    Talent retention is challenging for many organizations
    Finding reliable pet sitters for exotic pets is challenging
    Tracking personal carbon emissions is cumbersome
    Supply chain issues frequently cause product shortages
    Screen time raises concerns for child development
    Multiple streaming subscriptions become expensive
    Trendy clothes often sacrifice quality for affordability
    Premium running smartwatches are expensive
    Audio quality often suffers on music streaming platforms
    Finding reliable home service providers is often challenging
    Internal communication is often disjointed in organizations
    Sports betting often distracts from the enjoyment of game viewing
    Coordinating carpools for kids' activities is logistically challenging
    Organizing neighborhood watch programs is logistically challenging
    Non-native speakers struggle with voice assistants
    Organ transplant waitlists are often extremely long
    Healthcare access in conflict zones is often limited
    Ocean plastic pollution monitoring is often inadequate
    Finding reliable information on health symptoms is often difficult
    Football equipment is expensive for casual players
    Finding age-appropriate activities for kids is challenging for parents
    Dating sites lack nuanced compatibility filtering options
    Popular ski resorts often become overcrowded
    Securely transferring or reselling tickets is challenging
    Gauging compatibility through online dating is challenging
    Handwritten notes are easily lost or damaged
    Budgeting without professional advice can be challenging
    Virtual personal styling services often feel impersonal
    Exotic pets and their habitats are very expensive
    Managing personal art collections and provenance is challenging
    Coordinating care for elderly family members is challenging
    Online tutoring often lacks personalization for students
    Introverts prefer text-based customer support
    Coordinating shared ownership of expensive equipment is complex
    Greenhouse gas emissions monitoring is often inadequate
    Organizing and cataloging personal book collections is tedious
    Water usage in agriculture is frequently inefficient
    Losing keys is costly and inconvenient
    Finding reliable product reviews is challenging for consumers
    Sales pipeline management is often manual and inefficient
    Trying on clothes in stores is inconvenient
    Online friendships often focus too much on popularity metrics
    Sports live streams often buffer or lag during peak times
    Hunting gear is prohibitively expensive for newcomers
    Meal planning is time-consuming for busy individuals
    Travel booking sites often have hidden fees
    Tracking health metrics can be cumbersome for individuals
    Household energy costs are high in many areas
    Neurodivergent individuals need adapted job boards
    Urban traffic congestion management is challenging
    Agricultural water usage management is frequently inefficient
    Learning to create digital art has a steep learning curve
    Rock climbing equipment is expensive for beginners
    Working from home often leads to procrastination and distractions
    Regional blackouts restrict access to sports streams
    Online forums can enable unhealthy coping post-breakup
    Industry compliance is overwhelming for many businesses
    Managing personal collections of digital creative works is disorganized
    Managing personal wine collections and tasting notes is disorganized
    Night shift workers lack suitable food delivery options
    Limited resources for improving gaming skills and strategies
    Gene therapy treatments are rare and prohibitively expensive
    Waste management in cities is frequently inefficient
    Limited resources for learning to play musical instruments online
    Water quality monitoring systems are often inadequate
    Navigating complex financial regulations is challenging
    Energy management in manufacturing is challenging
    Forest fire detection systems are often inadequate
    Last-mile delivery in cities is often inefficient
    Energy management in commercial buildings is challenging
    ID verification processes are time-consuming and intrusive
    Special needs resources are limited for families
    Professional music production software is expensive
    Building a consistent networking habit is challenging
    Product packaging often creates excessive waste
    Recycling of electronic waste is frequently inefficient
    Organ transplant recipients risk rejection complications
    Finding local events and activities can be difficult in some areas
    Fostering deeper connections between fans and teams is challenging
    Self-help gurus often peddle pseudoscience to followers
    Education access for refugees is often limited
    Long-term value of electric cars is uncertain for buyers
    Product development processes are often slow and inefficient
    Real-time market data often requires paid subscriptions
    Long lines at sports events detract from the experience
    Finding reliable vacation rental reviews is difficult
    Finding cheap, comfortable home office equipment is difficult
    Comparing travel prices across platforms is time-consuming
    Professional makeup tools are expensive for beginners
    Constant monitoring is needed while cooking
    Ensuring kids meet nutrition guidelines is challenging
    Planning unique and creative dates is challenging
    Discovering new podcasts and audiobooks is time-consuming
    Some eco-friendly products lack long-term durability
    Managing multiple subscriptions is time-consuming
    Lost and found systems are often inefficient
    Maintaining consistent mindfulness practice is challenging
    Package shipping often experiences delays and mistakes
    Online language learning lacks true immersion experiences
    Wildfire smoke pollution monitoring is often inadequate
    Monitoring of industrial emissions is often inadequate
    Air quality monitoring in schools is often inadequate
    Online shoe sizing information is frequently inaccurate
    Comparing insurance options is complex and time-consuming
    Finding high-quality public speaking techniques is difficult
    Coordinating attendee schedules for events is challenging
    Comparing college options is daunting for prospective students
    Arranging pet sitting services is often challenging for pet owners
    Language barriers complicate international travel
    Limited access to personalized tutoring for complex subjects
    Eco-friendly home upgrades are often expensive
    Coupon clipping is tedious and time-consuming
    Difficulty in receiving tailored nutritional advice and meal plans
    Employee onboarding processes are often time-consuming for companies
    Limited resources for reducing personal carbon footprint
    Paper receipts are easily lost or damaged
    Affordable housing in urban slums is scarce
    Conflicting information on healthy eating found online
    Language barriers complicate independent trip planning
    Limited cloud storage for high-resolution video files
    Few tools exist to track child behavior patterns
    Customer feedback is poorly managed in many organizations
    Excessive product placement disrupts reality TV viewing
    Sports streams lack personalization options for viewers
    Purebred cats often have breed-specific health issues
    Mindfulness apps and courses are often expensive
    Public soccer fields are limited in many areas
    Coordinating community garden plots and harvests is logistically challenging
    Cancelling subscriptions is often unnecessarily complicated
    Physical tickets are easily lost or stolen
    Task delegation is often unclear in team environments
    Emotional support animal laws are often confusing
    Maintaining consistent personal branding is challenging
    Managing digital photos is often disorganized and time-consuming
    Difficulty in finding educational and entertaining content for children
    Deaf community needs more visual-based news services
    Fitness trackers often provide inaccurate data
    Manual fitness tracking is time-consuming
    Food tracking apps are time-consuming to use consistently
    Some design materials have negative environmental impacts
    Fake or biased restaurant reviews are common online
    Compatibility issues between video formats and software
    Shipping restrictions limit package contents
    Discovering new music tailored to personal taste is difficult
    Budgeting processes are often cumbersome for businesses
    Visually impaired users need more audio-based apps
    Coordinating community time banks and skill exchanges is logistically complex
    Coordinating neighborhood tool-sharing programs is logistically difficult
    Sharing planner information with others is difficult
    Clean water access in developing areas is limited
    Meeting online friends in person can feel unsafe
    Photo editing software has a steep learning curve
    Premium athleisure wear is expensive for casual users
    Sustaining meaningful DEI initiatives long-term is challenging
    Frequent hair treatments can cause long-term damage
    Art and music therapy is often difficult to access
    Paid fantasy sports leagues are expensive to join
    Professional cognitive behavioral therapy is expensive
    Finding compatible travel companions online is challenging
    Training plans lack sufficient customization options
    Annual sports game releases lack significant improvements
    Some artists' music is unavailable on certain platforms
    Recruitment processes are slow and inefficient for many companies
    Group travel packages are often overpriced
    Quality surfing gear is expensive for beginners
    Educational technology software isn't always accessibility-compliant
    Knowledge sharing is ineffective in many organizations
    Employee training is often inconsistent across organizations
    Specialized outdoor features are difficult to source
    VR/AI in education raises student data privacy concerns
    Difficulty in developing customized fitness routines
    Client reporting is time-consuming for many service providers
    Virtual property tours provide limited information for buyers
    Quality control processes are often inconsistent in manufacturing
    Professional hair styling tools are expensive for home use
    Proof of purchase is often required for warranty claims
    Tracking personal goals and habits is difficult to maintain long-term
    Cross-platform gaming compatibility is often limited
    Music algorithms often suggest irrelevant artists
    Updating paper planners is messy and time-consuming
    Decluttering home spaces is overwhelming for many individuals
    Limited access to personalized language learning programs
    Pricing strategy is often inflexible in changing markets
    Ticket scalping often inflates prices for consumers
    Identifying quality education providers can be difficult
    Healthy meal delivery services are expensive long-term
    Maintaining motivation with language apps is challenging
    Edtech doesn't always align with established curricula
    Language apps often lack specialized vocabulary options
    Limited digital options exist to track hunting data
    Online reminders of ex-partners make moving on difficult
    RTS games often face balancing issues post-release
    Managing schedules for multiple coffee chats is complex
    Healthcare access for homeless individuals is often limited
    Employee scheduling is time-consuming for many businesses
    Meeting scheduling is inefficient and time-consuming for teams
    Car racing raises safety and environmental concerns
    Some mindfulness techniques lack scientific evidence
    Budgeting apps lack built-in accountability features
    Online fitness groups can be intimidating for newcomers
    Discovering relevant content online is time-consuming
    Counterfeit coins and currency are common in the market
    Verifying documentary accuracy requires extensive research
    Contract management is frequently disorganized in businesses
    Cruelty-free and vegan makeup options are limited
    Hunting raises ecological concerns in some areas
    Troubleshooting smart home systems can be complex
    Designer items have limited availability for purchase
    High-volume trading can cause technical issues on platforms
    Limited Wi-Fi and cell service at large festivals
    Finding vintage car parts is challenging and time-consuming
    Tracking personal goals consistently is difficult for many people
    Finding specific rare coins is time-consuming
    Splitting and managing shared expenses is often complicated
    Skateboarding gear is expensive for casual riders
    Compatibility issues between music software and plugins
    Organizing networking events is logistically challenging
    Reducing personal carbon footprint is challenging for individuals
    Visualizing design changes requires specialized tools
    Eco-friendly products are typically more expensive
    Coordinating potluck dishes is often challenging
    Coordinating group activities is logistically difficult
    Difficulty in finding reliable house cleaning services
    Document version control is chaotic in many workplaces
    Expense reporting is tedious and error-prone for employees
    Licensing issues limit teams and players in sports games
    Short-term gains are often overemphasized in investing
    Brand consistency is hard to maintain across multiple channels
    Budget apps struggle to sync with all financial accounts
    Physical planners are bulky with limited space
    Specialty baking equipment is expensive for home cooks
    Invoice processing is manual and time-consuming for many businesses
    Time tracking is often inaccurate and tedious for employees
    Virtual date options are limited on most platforms
    Gift registry options are often limited to specific stores
    Managing medications and appointments is complex for patients
    Limited options to use cryptocurrency for everyday purchases
    Compatibility issues between cameras and editing software
    Digital journal privacy isn't always guaranteed
    Comparing prices across multiple stores is inefficient
    Limited options for personalized hair care recommendations
    Uploading writing often causes formatting inconsistencies
    Managing multiple loyalty cards is cumbersome
    Restaurants often lack accommodations for diverse dietary needs
    Advanced communication courses are limited in availability
    Limited cloud storage options for high-resolution photos
    Online trading platforms charge high transaction fees
    Trail maps and guides are frequently outdated
    Baseball equipment is expensive for casual players
    Comparing ski resort prices is time-consuming
    Cruelty-free and vegan beauty products are often pricier
    Few digital options exist to track kayaking routes
    Discovering independent artists is challenging
    Verifying authenticity of online designer purchases is difficult
    Limited quality educational content exists for specific age groups
    Filtering music by specific criteria is often limited
    Managing home maintenance tasks is time-consuming for homeowners
    Popular camping spots have limited permit availability
    Synthetic athleisure materials are often unsustainable
    Documentaries often present biased perspectives on issues
    Art and music therapy services are expensive
    Limited options for booking unique event venues online
    Some art and music therapists lack specialized experience
    Difficulty in sourcing bespoke interior design solutions
    Paid promotion hinders organic music discovery
    Food safety monitoring in supply chains is often inadequate
    Inclusive kids' activities are difficult to find locally
    Legal sports betting options are limited in many areas
    Licensed art and music therapists are scarce in many areas
    Management of chronic diseases is often inefficient
    Online therapy options for couples are limited
    Public pool availability is limited in many areas
    Quality gardening equipment is costly for hobbyists
    Sales forecasting is frequently inaccurate for businesses
    True crime content sometimes exploits tragedy victims
    Vegan makeup sometimes underperforms compared to traditional products
    Verifying ownership of lost items is challenging
    Inadequate tools for creating and sharing gaming content
    Limited access to personalized financial planning
    Difficulty in managing chronic health conditions with tailored care
    Difficulty in sourcing high-quality home brewing ingredients
    Dating events and experiences are often overpriced
    Fitness apps lack personalized workout options
    Food waste management is frequently inefficient
    Vendor management is disorganized in many companies
    Difficulty in managing and participating in online gaming tournaments
    Limited options for personalized child development tips
    Battery disposal poses environmental hazards
    Budget tools often ignore irregular income patterns
    Car restoration equipment is expensive for hobbyists
    Complex RTS games have steep learning curves for beginners
    Cooling data centers in water-scarce areas is challenging
    Educational technology is often expensive for schools to implement
    Efficacy of online CBT programs is sometimes questionable
    Finding compatible baseball players is challenging
    Healthy meal delivery services are expensive long-term
    Indoor radon level monitoring is often inadequate
    Niche food experiences are difficult to find and book
    Reality show casting lacks diversity in representation
    Up-to-date hunting regulations are scarce and complex
    Works by top artists have very limited availability
    Limited options for game customization and modding
    Difficulty in finding reliable coworking spaces while traveling
    Difficulty in managing personal diet and nutrition plans
    Difficulty finding local running groups online
    Finding affordable festival accommodations is challenging
    Finding reliable ingredient substitutions is challenging
    Finding reliable, up-to-date trail conditions is challenging
    High-performance car upgrades are prohibitively expensive
    Music production has a steep learning curve for beginners
    Plant species and disease identification is often inaccurate
    Professional public speaking coaching is expensive
    Quality online writing courses are expensive
    Sports betting can be addictive and financially risky
    Virtual networking events often feel awkward for participants
    Limited resources for tracking and analyzing gaming performance statistics
    Limited resources for tracking and managing trading card collections
    Inadequate tools for tracking and managing household waste
    Limited options for personalized travel insurance for digital nomads
    Challenges in finding skilled tradespeople for home repairs and maintenance
    Difficulty in finding age-appropriate games for children
    Athleisure sizing and fit lacks diversity for body types
    Compliance tracking is complex and time-consuming for businesses
    Concerns exist about effectiveness of special needs interventions
    Discovering new fantasy and sci-fi content is challenging
    Dressing for multiple seasons is challenging and costly
    Energy management in electric vehicles is challenging
    High-quality cycling gear is expensive for casual riders
    High-value art pieces are prohibitively expensive
    Online event invitations often get lost in email inboxes
    Pests and climate change threaten crop yields
    Baking recipe websites are cluttered with intrusive ads
    Digital gift registries often lack flexibility for users
    Few digital tools exist to track football performance
    Financial jargon is confusing for novice investors
    Finding volunteer activities that match skills is time-consuming
    Forest biodiversity monitoring is often inadequate
    Inventory tracking is frequently inaccurate for businesses
    Managing inventory to avoid over or understocking is difficult
    Premium journaling tools can be costly for daily use
    Vision and mobility impairments increase with age
    Pickleball equipment is expensive for casual players
    Schools often lack funding for VR/AI educational equipment
    Small factories often have high carbon footprints
    Difficulty in managing and optimizing gaming hardware and software settings
    Limited options for personalized crafting project recommendations
    Limited options for personalized sustainable living tips
    Limited access to personalized skincare routines
    Limited resources for developing personalized meditation practices
    Autonomous vehicles are vulnerable to hacking attempts
    Cash flow forecasting is inaccurate for many businesses
    Charitable donations lack transparency in fund allocation
    Crop monitoring in agriculture is often inefficient
    Durability of outdoor materials varies widely
    Electric car charging stations are limited in many areas
    Energy management in data centers is challenging
    Few digital tools exist to track skateboarding progress
    Management of construction waste is frequently inefficient
    Online communities can enable harassment and bullying
    Recipe blogs often contain excessive non-recipe content
    Risk management is often reactive rather than proactive
    Staying motivated to exercise alone is difficult
    Stroke recovery requires intensive, long-term rehabilitation
    Tracking vaccinations consistently is difficult for many individuals
    Unusual shoe sizes and styles are often hard to find
    Difficulty in finding eco-friendly personal care products
    Coordinating moving logistics is often stressful
    Hiking apps lack robust trail difficulty filtering options
    Language apps offer limited practice with native speakers
    Management of agricultural pests is frequently inefficient
    Niche fantasy sports options are limited in availability
    Online astrology readings can feel generic and impersonal
    Online gaming servers frequently experience instability
    Difficulty in finding reliable teammates for online multiplayer games
    Difficulty in discovering indie games that match personal interests
    Difficulty in finding reliable recipes for craft cocktails
    Difficulty in sourcing rare and high-quality cocktail ingredients
    Accessible transportation for people with disabilities is limited
    Digitizing old photos and documents is tedious and time-consuming
    Equipment maintenance is often reactive rather than proactive
    Indoor noise pollution monitoring is often inadequate
    Monitoring of bridge structural health is often inadequate
    Special needs families need more comprehensive support
    Styling athleisure for formal occasions is challenging
    Subscription boxes often generate excessive packaging waste
    Waste heat recovery in industries is frequently inefficient
    Difficulty in authenticating the value of trading cards
    Ineffective methods for protecting and preserving trading cards
    Difficulty in finding reputable sources for purchasing trading cards
    Limited resources for learning advanced makeup techniques
    Comprehensive financial planning software is expensive
    Developing personalized skincare routines is complex
    Diagnosing gut health issues is often complex and time-consuming
    Finding reliable true crime information is challenging
    Managing multiple medications is complicated for patients
    Paper comment cards are easily ignored or misplaced
    Recipe search filters don't cover all dietary restrictions
    Relationship advice online is often cliché or overly general
    Self-driving cars struggle to assess unpredictable situations
    Water leak monitoring in cities is often inadequate
    Limited resources for discovering and using gaming peripherals and accessories
    Challenges in finding reliable babysitting services
    Difficulty in sourcing high-quality crafting materials
    Borrowing items often requires physical proximity
    Car audio systems are expensive to purchase and install
    Comprehensive diversity and inclusion training is expensive
    Dockless scooters and bikes often obstruct sidewalks
    Facility management is often inefficient in large organizations
    Kayaking and paddleboarding gear is expensive for beginners
    Landslide risk monitoring is often inadequate
    Managing household chores is inefficient for many families
    Quality swimming gear is expensive for casual swimmers
    Reality TV shows often feature manufactured drama
    Refugees often lack proper identity documentation
    Returning e-commerce purchases on time is often forgotten
    Soil health monitoring techniques are often inadequate
    Team performance tracking is often subjective and inconsistent
    Verifying companies' sustainability claims is challenging
    Virtual basketball coaching options are limited
    Inadequate tools for finding and participating in trading card auctions
    Difficulty in finding reliable sources for space news and updates
    Advanced makeup techniques require professional training
    Asset management is inefficient in many organizations
    Comparing utility providers is complex and time-consuming
    Customer onboarding is inconsistent in many businesses
    Deep-sea exploration faces numerous technical challenges
    Designer clothes and accessories are prohibitively expensive
    Fast fashion contributes to pollution and waste
    Grading rare coins requires expert knowledge
    High-end patio furniture is expensive for homeowners
    Hiking apps lack easy trail filtering and comparison features
    Intellectual property management is weak in many companies
    Measuring precise cooking portions is difficult
    Planning meals for specific diets is time-consuming
    Tailored nutrition for rare disorders is limited
    Tee time availability is limited at popular courses
    Textile waste management is frequently inefficient
    Tracking children's emotional development is complex
    Wardrobe management is time-consuming for many individuals
    Effective dog training often requires professional help
    Fantasy and sci-fi visual effects often fall short of expectations
    Friendship apps are plagued by fake or inactive profiles
    Last-minute travel deals are limited in availability
    Locating trustworthy car restoration experts is difficult
    Maintaining contact with distant friends is challenging
    Sharing and organizing family recipes can be challenging
    VR platforms offer a limited selection of games
    Inadequate tools for managing in-game inventories across multiple games
    Limited options for personalized game recommendations based on play history
    Limited tools for organizing and planning DIY projects
    Inadequate resources for learning advanced crafting techniques
    Authentic cultural experiences are limited for tourists
    Authentic memorabilia for current athletes is limited
    Constant home security camera monitoring is impractical
    Few user-friendly options exist to track fishing catch data
    Financial education for youth is often limited
    Indoor air quality monitoring is often ineffective
    Limited personalized online nutrition advice available
    Loud car audio poses risks of hearing damage
    Mailing letters is slow and relatively expensive
    Maintaining consistent discipline is challenging for parents
    Managing customer feedback efficiently is difficult
    Managing multiple loyalty programs is cumbersome for consumers
    People often forget to return borrowed items
    Reliable water condition reports are limited for paddlers
    Reliable, up-to-date fishing reports are limited online
    Reliable, up-to-date surf reports are limited online
    Running apps often provide inaccurate GPS tracking
    Self-improvement efforts often lack built-in accountability
    Some DEI efforts are perceived as inauthentic or superficial
    Some people abuse emotional support animal privileges
    Difficulty in finding local gaming communities and events
    Difficulty in discovering niche music genres and artists
    Limited options for personalized space exploration content
    3D-printed part quality can be inconsistent
    Communication in remote Arctic research is unreliable
    Drawing apps lack realistic brush options
    Educational VR/AI software is expensive for institutions
    Group travel itineraries lack customization options
    In-person mindfulness classes have limited availability
    Limited reliable wildlife information sources available online
    Niche makeup products are difficult to find locally
    Public pickleball courts are limited in many areas
    Up-to-date snow reports are limited in accuracy
    Difficulty in finding and participating in local sustainability initiatives
    Limited options for personalized audio equipment recommendations
    Limited resources for learning advanced brewing techniques
    Car audio brands often have compatibility issues
    Coordinating group gifts can be logistically difficult
    Finding qualified emotional support animals is difficult
    Industry-specific DEI best practices are limited in scope
    Linking various smart home devices is often complicated
    Niche RTS games struggle to maintain active player bases
    Nutrition apps are often time-consuming to use daily
    Personal branding services are expensive for individuals
    Rare sports memorabilia is prohibitively expensive
    Taking notes by hand is slow and unorganized
    Verifying art authenticity requires specialized expertise
    Verifying local food recommendations is challenging
    Limited resources for learning about trading card game strategies
    Limited resources for learning about amateur astronomy
    Finding local skateboarding communities is challenging
    Fishing gear is expensive for casual anglers
    Limited availability of documentaries on niche topics
    Long-term effects of discipline methods are unclear
    Professional interior design services are expensive
    Rare coins and currency are expensive to collect
    Remotely tracking pet health and activity is challenging
    Robots struggle to navigate new environments effectively
    Soccer equipment is expensive for casual players
    Socially responsible investing options are limited
    Specialty cat breeds are expensive to purchase
    Supply chains for small organic farms lack transparency
    Tennis equipment is expensive for casual players
    Tracking self-improvement progress is challenging long-term
    User manuals are often misplaced or lost
    Workplace safety tracking is manual and inefficient
    Limited resources for learning advanced mixology techniques
    Breakup advice often lacks nuance for complex situations
    Campsite reservation systems are prone to glitches
    Limited online resources for advanced music production
    Recognizing emotions across cultures is challenging
    Reliable cultural etiquette information is scarce online
    Self-driving cars can cause motion sickness in passengers
    Shipping recovered items to owners can be costly
    Some dog breeders engage in unethical breeding practices
    Sports betting odds and terms are confusing for beginners
    Limited options for personalized trading card recommendations
    Difficulty in finding local crafting workshops and classes
    Inadequate tools for managing and organizing digital music libraries
    Comment cards offer limited space for detailed feedback
    Customizing fantasy league rules is often difficult
    Expressing emotions and building intimacy online is difficult
    Festival apps quickly drain smartphone batteries
    Guided hiking and climbing tours are limited in availability
    Online art courses need more personalized instruction
    Pediatric nutrition resources are limited for parents
    Remembering to care for houseplants consistently is challenging
    The bioprinting process for tissues is currently slow
    Unbiased financial education resources are scarce online
    Virtual car performance tracking options are limited
    VR/AI struggles to adapt to diverse learning styles
    Wildlife identification apps don't always work accurately
    Wildlife tourism can harm natural habitats and animal behavior
    Difficulty in finding and joining local music jam sessions
    Inadequate tools for staying connected with home country services
    Limited resources for learning advanced brewing techniques
    Limited options for personalized brewing equipment recommendations
    Detecting water leaks early is challenging
    Tracking the contents of multiple moving boxes is difficult
    Verifying sports memorabilia authenticity is challenging
    Bike navigation apps sometimes suggest unsafe routes
    Biomanufacturing processes are often inefficient
    Checking in-store stock availability is time-consuming
    Communication options for quadriplegics are limited
    Custom furniture often has limited availability
    Employee performance reviews are often biased and subjective
    Event planning software is expensive for complex events
    Finding certain rare dog breeds is challenging
    Finding exotic pets from reputable breeders is challenging
    Golf courses often have negative environmental impacts
    Managing shared micromobility vehicles is challenging for cities
    Micromobility vehicles have low availability in many cities
    Preserving old or delicate art requires specialized care
    Public basketball courts are limited in some areas
    Public tennis courts are limited in availability
    Relationship tracking apps can feel gimmicky or inauthentic
    Some old toys contain potentially hazardous materials
    Some specialized skincare ingredients are hard to source
    The exotic pet trade raises ethical concerns
    Trail apps require constant cell service or GPS signal
    True crime content can be triggering for sensitive viewers
    Limited resources for managing finances as a digital nomad
    Inadequate tools for tracking and managing brewing recipes
    Adult football leagues are limited in many areas
    Exotic cat breeds are difficult to find from reputable breeders
    Long-term effects of some skincare ingredients are concerning
    Online tennis coaching options are limited
    Safe and legal racing tracks are limited in many areas
    Scaling recipe portions up or down is often inaccurate
    Surf tourism can harm local environments and communities
    Tracking food expiration dates is tedious
    Virtual connections lack depth for long-distance friendships
    Difficulty in finding reliable trading partners for card exchanges
    Difficulty in finding and joining digital nomad communities
    Affordable online therapy for breakup recovery is limited
    Basketball equipment is expensive for casual players
    Complex car audio systems are difficult to self-install
    Environmental activism sites often lack actionable steps
    Few digital tools exist to track swimming performance
    Limited tools available for effective online community moderation
    Public baseball fields are limited in many areas
    Punch card reward systems are limited and inflexible
    Tracking gift preferences and sizes is challenging
    Tracking punch card progress is inconvenient
    Beginner-friendly surf spots are scarce in many areas
    Correctly sorting waste for recycling is often confusing
    Evidence-based parenting resources are limited online
    Few user-friendly ways to report wildlife sightings
    Filtering baking recipes by difficulty level is limited
    Finding compatible tennis partners is challenging
    Finding VR multiplayer partners is challenging
    Following virtual troubleshooting instructions is challenging
    Golf has complex rules and etiquette for newcomers
    Group travel booking lacks transparency in pricing
    Installing custom outdoor spaces requires expertise
    Limited virtual try-on options for designer goods
    Maintaining consistent journaling habits is challenging
    Niche art communities are difficult to discover online
    Online child health information isn't always reliable
    Verifying cruelty-free and vegan brand claims is challenging
    Vintage toys in mint condition are extremely pricey
    Accurately assessing vintage toy condition is challenging
    Comparing kayak rental prices is time-consuming
    Completing CBT homework assignments is often difficult
    Couples struggle to plan quality time amid busy schedules
    Evaluating the impact of eco-friendly options is complex
    Few digital tools exist to track car restoration progress
    Finding compatible soccer teammates is challenging
    Finding safe and clean swimming spots is challenging
    Fishing regulations vary widely by location and season
    Gardening apps rarely sync with irrigation systems
    Learning proper exotic pet care is complex and time-consuming
    Limited options for custom budget categories in apps
    Online cycling forums can be unwelcoming to newcomers
    Personalized online nutrition advice is limited in availability
    Preserving old sports memorabilia requires special care
    Separating fact from fiction in true crime media is difficult
    Some cultural tourism experiences exploit local communities
    Some personal branding efforts come across as inauthentic
    VR games often cause motion sickness for some users
    Documentaries often lack clear solutions or calls to action
    Few tools exist to analyze pickleball performance
    Finding fair and trustworthy fantasy sports sites is challenging
    Finding local pickleball clubs is challenging for beginners
    Journal writing prompts are often limited in variety
    Limited options for shoe recycling or donation programs
    Limited region-specific gardening advice available online
    Limited skill-based matchmaking in multiplayer games
    Managing cat behavioral needs can be challenging
    Restaurant recommendation algorithms ignore personal preferences
    Safe and legal skate spots are limited in many areas
    Self-improvement plans lack personalization for individuals
    Some makeup ingredients raise long-term safety concerns
    Substituting baking ingredients for dietary needs is complex
    Writing software lacks advanced features for professionals
    Campsite amenity information is often unreliable online
    Few reliable reviews exist for lesser-known restaurants
    Finding compatible basketball players is challenging
    Finding RTS tournaments and events is challenging
    Food experiences lack customization for dietary restrictions
    Inadequate tools for organizing and displaying trading card collections
    Limited options for personalized cocktail recommendations
    Difficulty in discovering and joining local trading card communities
    Difficulty in finding local home brewing clubs and events
    Avoiding reality show spoilers online is challenging
    Comparing electric car carbon footprints is complex
    Few digital tools exist to track baseball performance
    Few digital tools exist to track comprehensive child health data
    Financial advice is challenging to personalize effectively
    Finding reliable beta readers is challenging
    Food tours and experiences are often overpriced
    Hair coloring options are limited for some hair types
    Limited app options for finding platonic friendships
    Limited options for online bike maintenance tracking
    Niche sci-fi movies are difficult to find on streaming platforms
    Sustainable building materials have limited availability
    Tracking borrowed items can be difficult
    Tracking personal environmental impact is complex
    Vintage toy lines have limited availability for collectors
    Virtual soccer coaching options are limited
    Inadequate tools for tracking celestial events
    Difficulty in finding and joining local astronomy clubs
    It will never generate or use any problem statements that are not included in this list. This will be displayed on its own line after the business description.
    
    Step 5: the assistant will map the idea to one of the following market segments based on its closest fit:
    AI-powered Predictive Maintenance
    Educational Apps and Games
    Grocery Delivery Services
    AI Music Composition Tools
    Home Office Equipment E-Comm
    Remote Patient Monitoring & Wearable Integration
    Car Rental Apps
    Fashion E-commerce Platforms
    Digital Payments Software
    Social Media Platforms
    Micromobility Data Analytics & Insights
    Mobile Gaming Apps
    Corporate Training Software
    Auto Parts & Accessories E-commerce
    Telemedicine Practice Mgmt & EHR Systems
    Test Preparation Apps
    Fantasy Sports Platforms
    Solar Panel & Renewable Energy Markets
    Collectibles Authentication & Valuation
    AI Legal Technology
    Music Streaming Services
    Language Learning Software
    Sports Analytics Software
    P2P Lending Platforms
    Cycling Apps
    Personalized Learning Path & Recommendation Engines
    AI Script Writing Tools
    Sports Event Ticketing Software
    Stock Trading Platforms
    Virtual Reality Social Platforms
    Cloud Gaming Services
    E-books and Digital Libraries
    Video Streaming Services
    Gamified Employee Engagement & Performance Mgmt
    Sports Betting Software
    Online Ticket Booking Platforms
    Video on Demand (VOD) Services
    Custom Tailoring Apps
    Online Tutoring Services
    AI-powered Personalized Drug Discovery
    AI-powered Tutoring & Learning Companion Apps
    Subscription-based Home Services Markets
    Skincare & Makeup Apps
    Virtual Care Coordination & Collaboration
    Wildlife Tracking Apps
    Virtual Try-On Apps
    Microbiome Analysis & Personalized Probiotics
    Camping Gear Platforms
    Fitness and Training Apps
    Blockchain Gaming Platforms
    Fashion Trend Analysis Software
    Fashion Resale and Secondhand Platforms
    Food Reservation & Delivery Apps
    Solid-State Battery Management Systems
    Subscription Box Services
    Fan Engagement and Loyalty Platforms
    Messaging Apps
    Music Publishing and Royalty Platforms
    Virtual Reality Gaming
    Insurance Tech Platforms
    Group Activity Planning Apps
    Gear Rental Platforms
    Virtual Field Trip Platforms
    Zero-Waste Packaging & Shipping Solutions
    Virtual Classroom Platforms
    BCI-enhanced Learning & Training Apps
    BCI-based Neurorehabilitation Tools
    Matchmaking Apps
    Virtual Hair Styling & Color Simulation
    Personal Finance Software
    AI Video Analytics & Surveillance
    Meal Kit Delivery Services
    Micromobility Battery Swapping & Maintenance
    Privacy-focused Decentralized Social Networks & Messaging
    Professional Development & Upskilling
    Fishing Apps
    E-sports Platforms
    Metamaterial Antenna Design Software
    Learning Management Systems (LMS)
    VR Film Experiences
    Travel Insurance Platforms
    Robo-Advisors
    AI-powered Personalization & Recommendation Engines
    Electric Vehicle Charging Locators
    Home Automation & IoT Platforms
    Tax Preparation Software
    Neuromorphic Speech Recognition
    DeFi Yield Optimization Platforms
    Adventure Travel Apps
    Online Proposal Planning Services
    Smart Pet Accessories & Wearables
    Blockchain-based Supply Chain Transparency
    Event Planning Services
    Skill Assessment Tools
    Mental Health Tracking & Support
    Outdoor Sports Club & Community
    Digital Art and Portfolio Platforms
    Virtual Team Building & Engagement
    Game Development Software
    AI-driven Sales Forecasting & Demand Planning
    Music Collaboration Tools
    Online Learning Platforms
    AI-powered Assistive Technology & Communication Aids
    Personal Styling Apps
    Solid-State Battery Mfg Process Control
    Inclusive Virtual Try-on & Personalization for Fashion/Beauty
    Bioprinting Process Control/Monitoring
    Romantic Getaway Booking Apps
    Cryptocurrency Exchanges
    Music Production Software
    Quantum Optimization Solvers
    Game Streaming Services
    Conversational AI & Chatbot Platforms
    Sports Streaming and Media Platforms
    AI-powered Image & Video Editing
    Recipe Apps
    Online Cooking Classes and Platforms
    Autonomous Vehicle Fleet Management
    In-Car Entertainment & Infotainment
    Wealth Management Software
    Pharmacogenomics & Personalized Medication
    Online Dating Services
    AI-driven Predictive Analytics for Healthcare
    Gifting Apps
    Relationship Counseling Apps
    Concert Services & Livestreaming
    Zero-Knowledge Proof & Secure Credential Sharing
    Neuromorphic Sensor Processors
    Productivity & Time Tracking Apps
    Financial News and Analysis Platforms
    Food Waste Reduction Apps
    Nutrition Tracking Apps
    Micromobility Charging Infrastructure
    AI-driven Fraud Detection & Risk Mgmt
    Privacy-preserving Data Analytics & Machine Learning
    Personalized Telemedicine & Remote Monitoring
    Neuromorphic Robotics Controllers
    Game Development Software
    Sustainable Fashion Platforms
    DeFi Identity Verification & KYC
    Quantum Simulation Software
    Quantum Machine Learning Frameworks
    Movie/TV Show Recommendation Platforms
    Online Multiplayer Games
    Travel Booking Apps
    DeFi Insurance Protocols
    Vegan & Cruelty-Free Product Markets
    AI-driven Autonomous Drone Platforms
    Virtual Date Ideas Apps
    Subscription Box Curation & Personalization
    Subscription Management & Billing
    Diversity & Inclusion Training
    Telemedicine-specific Medical Device & Diagnostics
    Public Speaking Coaching Platforms
    BCI-controlled Smart Home Platforms
    Inclusive & Diverse Representation in Digital Media
    CRISPR-based Biomanufacturing
    Bioprinting Organ Design Software
    Micromobility Fleet Mgmt & Optimization
    Online Travel Agencies
    Tour Planning Software
    AI-powered Talent Acquisition & HR Analytics
    Professional Networking Sites
    Budgeting Apps
    Micro-credential & Digital Badging
    Restaurant Reservation Apps
    Couples' Communication Apps
    Snow Sports Gear & Apparel E-commerce
    Autonomous Vehicle Sensor Fusion
    Subscription-based Car Sharing & Leasing
    Sustainable Home Improvement Markets
    CRISPR-based Diagnostic Tools
    Gamified Corporate Training & Upskilling
    Ethical & Sustainable Investment Platforms
    Virtual Tour and Local Guide Platforms
    Metamaterial Optical Design Platforms
    Fashion Design Software
    Gamified Sustainability & Carbon Footprint Reduction
    Bioprinting Material Mgmt & Inventory
    Outdoor Fitness Apps
    Neuromorphic Vision Systems
    Sports Management Software
    Homomorphic Encryption & Secure Multi-Party Computation
    Dating Apps
    Athlete Performance Tracking Software
    Autonomous Vehicle Passenger Experience
    Travel Journal and Itinerary Apps
    Subtitle and Dubbing Software
    Animation and VFX Software
    Flight and Hotel Comparison Sites
    Website & Mobile App Testing & Optimization
    Solid-State Battery Performance Sim
    Food Blogging Platforms
    3D Modeling Software
    Digital Painting Software
    Autonomous Vehicle Cybersecurity
    Pet Training & Behavior Apps
    Family Nutrition & Meal Planning Apps
    Meditation and Mindfulness Apps
    Streaming Service Aggregators
    Film Production Software
    Database Management Tools
    Pet Adoption & Rehoming Platforms
    Stock Photography Platforms
    Remote Employee Wellness & Mental Health
    Quantum Cryptography Platforms
    Metamaterial-based Sensor Simulation
    Behavior Tracking & Rewards for Kids
    Photo Book Creation Software
    Online Auction Houses for Rare Items
    Food Allergy Management Apps
    Single-Player PC Games
    Photo Editing Software
    Bioprinted Organ Quality Assurance
    BCI-driven Emotion Recognition/Analysis
    Online Film Festivals
    Couple Goal Tracking Platforms
    Personal Finance Software
    Online Ad Networks
    Online Dating Sites
    Collectible Trading & Exchange
    Voice-to-Text Software
    CRISPR Crop Optimization Tools
    Desktop Publishing Software
    CRISPR Gene Therapy Design Software
    Photo Sharing Apps
    Email Marketing Platforms for SMBs
    Desktop Photo Editing Software
    Online Art Marketplaces
    Sustainable Home Energy Management Systems
    Photo Editing Mobile Apps
    Personal Branding & Portfolio Websites
    DJ Software
    Desktop Weather Applications
    SEO Tools
    Graphic Design Software
    Desktop Publishing Suites
    Job Boards & Websites
    Genealogy Software
    DIY Car Maintenance & Repair Apps
    Virtual Fashion & Try-On Apps
    Music Learning Apps
    Hiking and Trail Apps
    Language Translation Software
    Pet Health & Wellness Apps
    Inclusive Education & Accessibility
    Surfing Apps
    Desktop 3D Modeling Software
    Digital Painting Software
    DeFi Compliance & Regulatory Reporting
    Metamaterial Cloaking Device Modeling
    Video Editing Software
    Online Music Marketplaces
    Online Polling Tools
    Animation Software
    Solid-State Battery Recycling/Lifecycle
    Racing Simulation Software
    Podcast Hosting Platforms
    Digital Notetaking Apps
    Auction Websites
    Virtual Interior Design Services
    Geolocation & Navigation Apps
    Outdoor Adventure Planning & Booking
    Online Stock Photo Platforms
    Standalone Malware Removal Tools
    Music Recording Software
    Astrology Apps
    Travel Blogging Platforms
    Online Shopping Comparison Tools
    Handwriting Recognition Apps
    E-book Reader Apps
    Ad Blockers
    Home Design Software
    Photo Storage Software
    3D Design Software
    Language Learning Apps
    Marine Navigation Apps
    Manuscript Management Software
    GPS Navigation Software
    Urban Planning Software
    Learn to Code Education Apps
    Music Tuning Apps
    Cooking & Recipe Apps
    Personal Budgeting Apps
    Self-Improvement Apps
    Paddlesports Apps
    Online Puzzle Games
    Child Development Apps
    Online File Conversion Services
    Virtual Reality Tours
    Art Education Platforms
    Fantasy Sports Platforms
    Online Photo Sharing Websites
    Scale Modeling Software
    Event Planning Software
    Journaling & Personal Development Apps
    Online Survey Platforms
    Internet Radio Platforms
    Gardening and Landscaping Apps
    Meditation Apps
    Digital Scrapbooking Apps
    Coupon and Deal Apps
    Virtual Board Games
    Virtual Aquarium Apps
    Indoor Navigation Apps
    Interactive Storytelling Apps
    Hunting & Fishing License/Permit
    Astronomy Apps
    Virtual Home Design Apps
    Collection Management Software
    Fishing Apps
    Virtual Pet Apps
    Art Therapy Apps
    Online Recipe Sharing Platforms
    Tattoo Design Software
    Wine Recognition Apps
    Online Book Clubs
    Birdwatching Apps
    Skateboarding Apps
    Pet Training Apps
    Home Inventory Management Software
    Volunteer Management Software
    Virtual Museums & Exhibits-Collectibles
    Mobile Flashlight Apps
    It will never generate or use any market segments that are not included in this list. This will be displayed on its own line after the problem statement.
    
    Step 6: Final Check: The assistant will double-check that the selected problem and market segment is from the lists provided earlier in this prompt. If the problem statement or market segment is not on the respective list, the assistant will revise the selection to use a problem or segment from the list that best fits the generated idea.
    
    Illustrative Examples
    Input: workout app for millennial professionals focused on 5 minute workouts that fit into your daily life. 
    Output: {
      idea: "5-Minute Workouts Mobile App",
      description: "An app offering 5-10 minute micro-workouts tailored to your daily routine and schedule built specifically for millennial professionals.",
      problem: "Fitness apps lack personalized workout options",
      market: "Fitness and Training Apps",
    }
    
    Input: a live voting app where football fans get to influence real game decisions and nominate players of the game. 
    Output: {
      idea: "Real-Time Fan Voting App",
      description: "An app that conducts real-time polls during football games, allowing football fans to vote on player of the match, game strategies, and more.",
      problem: "Fostering deeper connections between fans and teams",
      market: "Fan Engagement and Loyalty Platforms",
    }
    
    Input: an app that send pictures of moments and memories to a group chat of friends for birthdays, event anniversaries, etc. 
    Output: {
      idea: "Celebrations & Memories for Group SMS",
      description: "An app that automatically creates and shares photo memories with friends and family via group texts on special occasions and anniversaries.",
      problem: "Virtual connections lack depth for long-distance friendships",
      market: "Photo Sharing Apps",
    }
    
    Input: an app that helps songwriters create and get feedback on their work using AI 
    Output: {
      idea: "AI Producer & Director for Songwriting",
      description: "An app that provides songwriting creation tools, and feedback, helping artists develop their songwriting abilities and create original music.",
      problem: "Limited online resources for advanced music production",
      market: "Music Production Software",
    }
    
    Input: platform that allows parents to upload a sample of their voice and picture that AI turns into a child youtube video, so it feels like they are the star of the video and teaching their own children. 
    Output: {
      idea: "AI-powered Kids' Music Videos Featuring Parents",
      description: "An AI platform that allows parents to upload a voice recording and picture to create educational music videos featuring them as the performer",
      problem: "Screen time raises concerns for child development",
      market: "Film Production Software",
    }
    Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Also, ensure that the problem and market should be selected from the given list and strictly do not recommend any other problem or market which is not available in the list
    Strictly ensure that you return only the required JSON parsable response and nothing else`,
  PHYSICAL_PRODUCT: `Step 1: The assistant will make minor language modifications to the user input without losing any content or context. It will ensure the business idea sounds professional and well-articulated. It will never add new components to the business idea and use similar language to that used in the user input. The description will always be 140 characters or less.

  Step 2: The assistant will describe the core concept and key differentiating feature in 140 characters or less, using clear and concise language. It will also provide the market segment chosen from the list in a separate line below the idea. It will never add core differentiating features or new concepts that are not included in the user input.
  
  Step 3: Then, the assistant will generate a simplified description of business idea in 6 words or less. The description should concisely convey the core concept by highlighting its unique value proposition. This will precede the business idea description on its own line.
  
  Step 4: The assistant will map the business idea and description to one of the following problem statements based on its closest fit:
  Quality drawing tablets are pricey
  High-quality cameras are expensive
  Quality video equipment is pricey
  Running smartwatches are expensive
  Workout equipment is costly
  Fitness trackers are inaccurate
  Quality cycling gear is expensive
  Healthy meal delivery is pricey
  Festival apps drain phone batteries
  Limited Wi-Fi/cell service at festivals
  VR gaming equipment is pricey
  VR games cause motion sickness for some
  Financial jargon is confusing
  Limited ways to use crypto for purchases
  Unbiased financial education is scarce
  Budgeting needs accountability/support
  Meeting friends online feels unsafe
  Wildlife tourism harms the environment
  Trail apps need cell service/GPS
  Reliable trail conditions hard to find
  Backpacking/camping gear is expensive
  Plant species/disease ID is difficult
  Gardening equipment is costly
  Gardening apps not synced with irrigation
  Tracking personal environmental impact
  Eco-friendly products are expensive
  Group travel packages are pricey
  Authentic cultural experiences limited
  Language barriers complicate trip planning
  Some cultural tourism exploits
  Food tours/experiences are expensive
  Food experiences lack diet customization
  Designer items have limited availability
  Designer clothes/accessories are pricey
  Limited virtual try-on for designer goods
  Unusual shoe sizes/styles often hard to find
  Shoe sizing info is inaccurate
  Quality/specialty shoes are expensive
  Limited shoe recycling/donation options
  Fast fashion pollutes and creates waste
  Trendy clothes are low-quality
  Plus-size/inclusive sizing options limited
  Dressing for multiple seasons is hard
  Premium athleisure wear is expensive
  Athleisure sizing/fit lacks diversity
  Synthetic athleisure materials unsustainable
  Styling athleisure for formal occasions
  Fantasy/sci-fi effects/quality falls short
  Restaurants lack dietary accommodations
  Substituting baking ingredients for diets
  Specialty baking equipment is pricey
  Healthy meal delivery is expensive
  Dating events/experiences are expensive
  Planning unique/creative dates is hard
  Couples struggle to plan quality time
  Schools lack VR/AI equipment
  Self-improvement lacks accountability
  Edtech is expensive for schools
  Popular camping spots have limited permits
  Camping gear is expensive
  Trail maps/guides are outdated
  Climbing equipment is expensive
  Limited guided hiking/climbing tours
  Fishing gear is expensive
  Hunting gear is expensive
  Hunting raises ecological concerns
  Skiing/snowboarding gear is expensive
  Popular ski resorts get crowded
  Surfing gear is expensive
  Beginner-friendly surf spots scarce
  Surf tourism harms the environment
  Skateboarding gear is expensive
  Safe/legal skate spots are limited
  Kayaking/paddleboarding gear is expensive
  Sports betting is addictive/risky
  Live sports event tickets are expensive
  Hard to navigate busy stadiums/parking lots
  Long lines at sports events
  Pickleball equipment is expensive
  Public pickleball courts are limited
  Tennis equipment is expensive
  Public tennis courts are limited
  Golf equipment is expensive
  Golf courses harm the environment
  Swimming gear is expensive
  Public pool availability is limited
  Safe/clean swimming spots are hard to find
  Basketball equipment is expensive
  Public basketball courts are limited
  Football equipment is expensive
  Adult football leagues are limited
  Football raises safety/health concerns
  Soccer equipment is expensive
  Public soccer fields are limited
  Baseball equipment is expensive
  Public baseball fields are limited
  Quality educational tools are expensive
  Tracking children's emotional development
  Screen time concerns for child development
  Keeping discipline consistent is hard
  Ensuring kids meet nutrition guidelines
  Special needs resources are limited
  Inclusive kids' activities are hard to find
  Concerns about special needs interventions
  Special needs families need more support
  Car restoration equipment is expensive
  Finding vintage car parts
  Expensive high-performance car upgrades
  Safe/legal racing tracks are limited
  Safety/environmental concerns in car racing
  Electric/eco-friendly cars are expensive
  Electric car charging stations limited
  Electric cars' long-term value uncertain
  Car audio systems are expensive
  Car audio brands aren't always compatible
  Complex car audio is hard to install
  Loud car audio risks hearing damage
  Pro makeup tools are expensive
  Niche makeup products hard to find
  Advanced makeup needs pro training
  Makeup ingredients raise safety concerns
  High-end skincare is expensive
  Some skincare ingredients hard to find
  Personalized skincare routines are tricky
  Skincare ingredients concerning long-term
  Cruelty-free/vegan beauty products pricier
  Cruelty-free/vegan makeup hard to find
  Vegan makeup doesn't perform as well
  Pro hair tools are expensive
  Hair coloring limitations
  Achieving some hairstyles requires a pro
  Hair treatments damage hair over time
  Rare sports memorabilia is very expensive
  Limited authentic memorabilia for athletes
  Verifying sports memorabilia authenticity
  Hard to preserve old sports memorabilia
  Rare coins/currency expensive to collect
  Finding rare coins
  Grading rare coins needs expert knowledge
  Counterfeit coins/currency are common
  Vintage toys in mint condition are pricey
  Vintage toy lines have limited availability
  Accurately assessing vintage toy condition
  Some old toys contain hazardous materials
  High-value art is very expensive
  Works by top artists have limited availability
  Verifying art authenticity demands expertise
  Preserving old/delicate art is difficult
  In-person mindfulness classes are limited
  Remembering consistent mindfulness
  Art/music therapy is expensive
  Licensed art/music therapists are scarce
  Art/music therapy is hard to access
  Art/music therapists lack experience
  Premium journaling tools are pricey
  Consistent journaling is hard to remember
  Professional CBT is expensive
  CBT homework is challenging
  Purebred dogs are expensive
  Hard to find certain rare dog breeds
  Training dogs requires professional help
  Dog breeders mistreat animals
  Specialty cat breeds are expensive
  Exotic cat breeds are hard to find
  Managing cat behavioral needs
  Purebred cats have health issues
  Exotic pets/habitats are very expensive
  Exotic pets from reputable breeders limited
  Learning how to care for exotic pets
  Exotic pet trade is unethical
  Professional animal training is expensive
  Hard to find emotional support animals
  Abusing emotional support animal privileges
  High-end smart home devices are pricey
  Compatibility of smart home equipment
  Troubleshooting smart home equipment
  Smart homes have privacy/security risks
  Professional interior design is expensive
  Custom furniture has limited availability
  Visualizing design changes requires tools
  Design materials harm the environment
  High-end patio furniture is expensive
  Specialized outdoor features hard to find
  Installing custom outdoor spaces
  Durability of outdoor materials
  Eco-friendly home upgrades are expensive
  Sustainable building materials are limited
  Evaluating eco-friendly options' impact
  Eco-friendly products don't always last
  Personal branding services are expensive
  Premium personal branding tools limited
  Consistent personal branding is hard
  Inauthentic personal branding
  Public speaking coaching is expensive
  Overcoming public speaking fear is hard
  Finding quality public speaking techniques
  Professional certifications are expensive
  Continuing education while working is hard
  Meaningful DEI initiatives hard to sustain
  DEI efforts come across as inauthentic
  Delays & mistakes with package shipping
  Vision/mobility impairment with age
  Taking phone calls in busy/loud places
  Robot navigation in new environment
  Internet connectivity in rural areas
  Limited battery life in wearable devices
  High energy cost in old buildings
  Cameras are bulky and break easily
  Rare disease screening is expensive
  Gene therapy is rare & expensive
  Biomanufacturing process is inefficient
  Pests & climate change destroy crops
  Limited battery range on electric cars
  Device batteries degrade over time
  Battery disposal harms the environment
  Difficult to link smart home devices
  Stroke recovery requires intense rehab
  Emotion recognition in different cultures
  Long organ transplant waitlists
  Inconsistent 3D-printed part quality
  Organ transplant rejection risk
  Slow bioprinting process
  Self-driving cars assessing unpredictability
  Autonomous vehicle hacking vulnerability
  Motion sickness in self-driving cars
  ID verification is time-consuming & scary
  WFH loneliness and burnout
  Cheap/comfortable home office equipment
  WFH procrastination and distractions
  Medication effectiveness varies
  Difficult gut health diagnosis
  Multiple medication management
  Excessive product packaging waste
  Product shortages from supply chain
  High household energy costs
  Low availability of micromobility vehicles
  Micromobility vehicles obstruct sidewalks
  Managing dockless scooters/bikes
  Locating charged micromobility vehicles
  Subscription box packaging waste
  Easily lost or damaged receipts
  Proof of purchase needed for warranties
  Expensive and limited city parking
  Parking meter payment restrictions
  Coupon clipping is tedious
  Time-consuming in-store stock checks
  Losing keys is costly and inefficient
  Constant home security camera monitoring
  Heavy and quickly outdated textbooks
  Difficult used textbook resale
  Taking notes is slow and unorganized
  Handwritten notes are easily lost/damaged
  Planners are bulky and have limited space
  Messy/time-consuming planner updates
  Building a habit of networking
  Difficult to manage networking events
  Misplaced user manuals
  Difficult to find specific info in user manuals
  Hard to measure portions when cooking
  Constant monitoring needed while cooking
  Challenging borrowed item tracking
  Physical proximity needed for item borrowing
  Forgetting to return borrowed items
  Slow and expensive letter mailing
  Shipping restrictions limit package contents
  Easily lost or stolen tickets
  Ticket scalping inflates prices
  Difficult secure ticket transfer/resale
  Limited comment card feedback space
  Easily ignored or lost comment cards
  Inefficient lost and found systems
  Challenging lost item ownership verification
  Costly lost item shipping to owners
  Limited and inflexible punch card rewards
  Tracking moving boxes and contents
  Stressful moving logistics coordination
  Trying on clothes is inconvenient
  Planning meals for specific diets
  Language barriers when traveling
  Tracking food expiration dates
  Sitting in traffic is a waste of time
  Visualizing furniture before purchasing
  Tracking pet health/activity remotely
  Staying motivated to exercise alone
  Unexpected appliance breakdowns
  Carrying multiple payment/loyalty cards
  Choosing outfits is time-consuming
  One-size-fits-all education
  Frequent doctor visits for chronic issues
  Detecting water leaks early
  Sorting waste correctly is confusing
  Overstocking/understocking inventory
  Remembering to care for plants
  Controlling multiple smart home devices
  Budgeting without professional advice
  Not returning e-commerce purchases in time
  Limited communication for quadriplegics
  Lack of identity proof for refugees
  Data center cooling in water-scarce areas
  Inaccessible PTSD support for veterans
  Unaffordable housing in urban slums
  High carbon footprint of small factories
  Unreliable comms in remote Arctic research
  Lack of tailored nutrition for rare disorders
  Challenges in deep-sea exploration
  Opaque supply chains for small organic farms
  Inefficient crop monitoring in agriculture
  Lack of accessible education in remote areas
  Inadequate water quality monitoring
  Inefficient waste management in cities
  Limited access to healthcare in rural areas
  High energy consumption in buildings
  Inefficient last-mile delivery in cities
  Access to clean energy in developing nations
  Inadequate forest fire detection
  Inefficient waste heat recovery in industries
  Lack of accessible mental health support
  Inefficient indoor air quality monitoring
  Access to clean water in developing areas
  Inadequate monitoring of soil health
  Inefficient energy storage for renewables
  Accessible legal services for low-income
  Inadequate monitoring of industrial emissions
  Inefficient water usage in agriculture
  Access to financial services for unbanked
  Inefficient management of chronic diseases
  Lack of transparency in supply chains
  Energy management in data centers
  Limited access to education for refugees
  Monitoring of bridge structural health
  Inefficient recycling of electronic waste
  Accessible transportation in rural areas
  Monitoring of air pollution in cities
  Inefficient management of food waste
  Access to mental health support for seniors
  Inadequate monitoring of forest biodiversity
  Inefficient energy management in homes
  Job training for underserved youth
  Inadequate monitoring of water leaks in cities
  Inefficient management of agricultural pests
  Limited access to healthcare in conflict zones
  Monitoring of ocean plastic pollution
  Energy management in manufacturing
  Accessible financial education for youth
  Inadequate monitoring of landslide risk
  Inefficient management of construction waste
  Access to clean energy in off-grid areas
  Inadequate monitoring of indoor noise pollution
  Management of urban traffic congestion
  Mental health support for LGBTQ+
  Inadequate monitoring of air quality in schools
  Energy management in electric vehicles
  Access to healthcare for migrant workers
  Monitoring of greenhouse gas emissions
  Inefficient management of textile waste
  Accessible education for incarcerated individuals
  Monitoring of wildfire smoke pollution
  Energy management in commercial buildings
  Mental health support for new mothers
  Monitoring of food safety in supply chains
  Management of agricultural water usage
  Accessible transportation for people with disabilities
  Monitoring of indoor radon levels
  Energy management in low-income homes
  Access to healthcare for homeless individuals
  Wardrobe management is time-consuming
  Wedding planning is stressful
  Meditation classes lack ambiance
  Meal planning is time-consuming
  Finding reliable home service providers
  Coordinating group activities is challenging
  Managing personal finances is overwhelming
  Digitizing old photos/documents is tedious
  Tracking health metrics is cumbersome
  Learning new skills lacks motivation
  Managing household chores is inefficient
  Finding age-appropriate activities for kids
  Comparing insurance options is confusing
  Tracking personal goals/habits is hard
  Managing medications & appointments
  Coordinating care for elderly family members
  Reducing personal carbon footprint
  Managing home maintenance tasks
  Tracking and improving sleep
  Tracking personal goals
  Decluttering home is overwhelming
  Pet sitting arrangements are difficult
  Time management is challenging
  Tracking vaccinations is inconsistent
  Estate planning is complex
  Inventory tracking is inaccurate
  Supply chain visibility is limited
  Employee training is inconsistent
  Asset management is inefficient
  Quality control is inconsistent
  Employee engagement is low
  IT support is overwhelmed
  Facility management is inefficient
  Product development is slow
  Workplace safety tracking is manual
  Equipment maintenance is reactive
  Talent retention is challenging
  Brand consistency is hard to maintain
  Deeper connections between fans & teams
  Food spoils quickly in the fridge
  Shoes hurt feet after long walks
  Phone screens break too easily
  Homes are drafty and cold
  Messy desks slow down work
  Suitcases are a pain to carry
  Poor lighting strains the eyes
  Single-use items create lots of trash
  Office chairs make backs ache
  Noise makes it hard to sleep
  Can't open packaging without scissors
  Cleaners leave surfaces still dirty
  Tiny apartments lack storage space
  Bike locks are easy to break
  Kitchen gadgets are hard to use
  Earbuds make ears sore
  Garden watering wastes water
  Adaptive clothes look unfashionable
  Phone chargers are always missing
  Sunburns happen despite sunscreen
  Gym equipment hogs living space
  Indoor air feels stuffy and unhealthy
  Power outages disrupt everything
  Mattresses don't guarantee good sleep
  Bugs keep invading the house
  Walkers and canes limit movement
  Backpacks strain the shoulders
  Heating bills are sky-high
  Kids' toys break too quickly
  Leftovers go bad fast
  Safety gear is uncomfortable to wear
  House smells linger forever
  Rooms feel stuffy with no breeze
  Gardening hurts the back and knees
  Sorting recycling is confusing
  People avoid wearing safety equipment
  Eco-friendly packaging is rare
  Pet beds get smelly quickly
  Neighbors' noise is always audible
  Orthopedic shoes look unattractive
  Closets are always a mess
  Tap water tastes funny
  Phones die during outdoor trips
  Bike seats cause numbness
  Home alarms are easily triggered
  Disposable party items create waste
  Office lighting causes headaches
  Meal prep takes too long
  Travel pillows don't help neck pain
  Patio furniture rusts quickly
  Stains won't come out of clothes
  Car interiors smell musty
  Furniture doesn't fit small spaces
  Solar panels don't work at night
  Beauty products have harmful chemicals
  Winter coats aren't warm enough
  Litter boxes smell up the house
  Smartwatches irritate the skin
  Smart home devices don't work together
  Composting indoors attracts fruit flies
  Blankets are too hot or cold
  Rain jackets aren't actually waterproof
  Headphones don't block all noise
  Cooking with disabilities is challenging
  Face masks make breathing difficult
  Home workouts require too much space
  Gift wrap creates lots of waste
  Computer mice cause wrist pain
  Dust allergies are hard to manage
  Camping gear is bulky to pack
  Sitting all day hurts the back
  Old appliances use too much power
  Kids outgrow clothes too fast
  Shops struggle with inventory storage
  DIY projects often go wrong
  Disabled athletes lack proper gear
  VR headsets cause motion sickness
  Office trash piles up quickly
  Maternity clothes aren't stylish
  Clothes don't block harmful UV rays
  Basements feel damp and moldy
  Portable chargers die too quickly
  Smartphones are hard to use one-handed
  Furniture doesn't fit odd-shaped rooms
  Plants die from irregular watering
  Construction harnesses are uncomfortable
  Winter coats are bulky to store
  Shower curtains get moldy fast
  Big furniture won't fit through doors
  Luggage falls apart after few trips
  Cars get stuffy on long drives
  Travel snacks get crushed in bags
  Public benches are uncomfortable
  Elderly struggle with button-up shirts
  Mosquitoes ruin outdoor gatherings
  Camping in the dark is tricky
  Delivery boxes pile up at home
  Birthday decorations create lots of trash
  Portable speakers sound tiny
  Screens cause eyestrain at night
  Healthy snacks taste bland
  Coffee goes cold too quickly
  T-shirts shrink in the wash
  Skincare products cause breakouts
  Dish soap doesn't cut through grease
  Organic produce spoils fast
  Energy drinks cause jitters
  Jeans wear out in the thighs
  Deodorants leave white marks
  Cleaning sprays have harsh smells
  Fertilizers harm beneficial insects
  Protein bars taste like cardboard
  Wine bottles are hard to open
  Dress shirts wrinkle easily
  Sunscreen feels greasy on skin
  Laundry detergent doesn't remove stains
  Pesticides contaminate crops
  Meal replacement shakes aren't filling
  Beer foam disappears too quickly
  Socks get holes easily
  Shampoo dries out hair
  All-purpose cleaners aren't truly all-purpose
  Soil loses nutrients quickly
  Granola bars are too sugary
  Bottled water creates plastic waste
  Workout clothes retain odors
  Face masks clog pores
  Disinfectants don't smell fresh
  Seeds don't germinate consistently
  Instant noodles lack nutrition
  Sparkling water loses fizz quickly
  Leather shoes need frequent polishing
  Toothpaste doesn't whiten effectively
  Air fresheners smell artificial
  Compost attracts pests
  Cereal gets soggy too fast
  Juice contains too much sugar
  Raincoats aren't breathable
  Moisturizers feel heavy on skin
  Garbage bags tear easily
  Plant pots drain poorly
  Salad dressings separate in bottle
  Tea bags create unnecessary waste
  Dress shoes hurt after hours
  Hair dye damages hair
  Carpet cleaners leave residue
  Hydroponics systems are complicated
  Protein powder doesn't mix well
  Canned beverages are wasteful
  Swimwear fades from chlorine
  Nail polish chips quickly
  Window cleaners leave streaks
  Mulch washes away in rain
  Veggie chips aren't actually healthy
  Coconut water tastes inconsistent
  Leggings become see-through
  Body lotions feel sticky
  Dishwasher tablets leave residue
  Indoor plants need constant care
  Gluten-free bread tastes off
  Flavored water has artificial taste
  Winter coats aren't waterproof
  Acne treatments dry out skin
  Dusting sprays just spread dust
  Crop rotation is complicated
  Dried fruits have added sugar
  Kombucha has short shelf life
  Wool sweaters are itchy
  Lipstick dries out lips
  Toilet cleaners have strong chemicals
  Vertical farming is energy-intensive
  Nut milks separate in coffee
  Hard seltzers lack flavor
  Dress pants lose shape quickly
  Eye creams don't reduce puffiness
  Oven cleaners are toxic
  Raised garden beds are expensive
  Frozen meals lack fresh taste
  Reusable water bottles retain smells
  Athletic socks slip down
  Dry shampoo leaves residue
  Reusable shopping bags get dirty
  Heirloom seeds are hard to find
  Low-calorie ice cream isn't creamy
  Herbal teas lack strong flavor
  Silk clothes require dry cleaning
  Natural deodorants don't work well
  Drain cleaners are harmful to pipes
  Greenhouse kits are hard to assemble
  Vegan cheese doesn't melt right
  Probiotic drinks taste medicinal
  Sun hats aren't stylish
  BB creams have limited shades
  Eco-friendly cleaners aren't effective
  Soil pH is hard to balance
  Keto snacks are high in calories
  Boxed wine doesn't stay fresh
  Activewear isn't office-appropriate
  Hand creams leave hands greasy
  Natural pesticides aren't strong enough
  Work clothes are uncomfortable & fit poorly
  Food & beverage ingredients are toxic
  It will never generate or use any problem statements that are not included in this list. This will be displayed on its own line after the business description.
  
  Step 5: the assistant will map the idea to one of the following market segments based on its closest fit:
  Drawing Supplies
  Painting Supplies
  Canvas and Paper
  Cameras and Lenses
  Photography Accessories
  Lighting and Studio Equipment
  Writing Instruments
  Notebooks and Journals
  Calligraphy Sets
  Art Supplies
  Golf Equipment
  Tennis Equipment
  Pickleball Equipment
  Golf Apparel
  Skis and Snowboards
  Ski and Snowboard Apparel
  Ski & Snowboard Accessories
  Team Sports Equipment
  Protective Gear
  Team Apparel
  Training Equipment
  Swimwear
  Swim Accessories
  Swim Training Gear
  Pool Equipment
  Festival Gear
  Concert Merchandise
  Festival Apparel
  Portable Food & Drink
  Audio Equipment
  Home Audio Systems
  Portable Audio
  Musical Instruments
  Recording Equipment
  Music Production Gear
  DJ Equipment
  Music Merchandise
  Fan Apparel
  Concert Accessories
  Posters and Prints
  VR Headsets
  VR Accessories
  Gaming Consoles
  PC Gaming Hardware
  Gaming Accessories
  Coin Collecting Supplies
  Precious Metal Coins
  Currency Collecting
  Coin Grading Services
  Autographed Merchandise
  Memorabilia Display Cases
  Replica Trophies
  Vintage Sports Memorabilia
  Action Figures
  Trading Cards
  Board Games
  Educational Toys
  Antique Furniture
  Historical Documents
  Vintage Watches
  Rare Books
  Board Games
  Outdoor Gear
  Portable Food & Drink
  Picnic Supplies
  Party Supplies
  Group Games
  Outdoor Furniture
  BBQ Equipment
  Holiday Decorations
  Gift Items
  Baking Supplies
  Beverages
  Party Games
  Camping Gear
  Hiking Gear
  Camping Food
  Navigation Equipment
  Bicycles
  Cycling Gear
  Bike Accessories
  Electric Bikes
  Fishing Gear
  Fishing Apparel
  Fishing Boats
  Fishing Accessories
  Water Sports Equipment
  Swimwear and Accessories
  Inflatable Water Toys
  Boating Gear
  Travel Accessories
  Leisure Products
  Beach Gear
  Spa Products
  Outdoor Gear
  Adventure Equipment
  Team Building Kits
  Travel Gear
  Guidebooks and Maps
  Gourmet Foods
  Cooking Classes
  Food Tours
  Luxury Clothing
  Luxury Accessories
  High-End Shoes
  Luxury Outerwear
  Athletic Shoes
  Designer Shoes
  Casual Shoes
  Outdoor Shoes
  Fast Fashion
  High-End Fashion
  Sustainable Fashion
  Streetwear
  Athleisure Clothing
  Athleisure Footwear
  Yoga Gear
  Fitness Accessories
  Running Shoes
  Running Apparel
  Running Accessories
  Nutrition for Runners
  Weightlifting Equipment
  Weightlifting Apparel
  Supplements
  Home Gym Equipment
  Fitness Equipment
  Fitness Apparel
  Yoga Gear
  Supplements
  Home Gym Equipment
  Exercise Accessories
  Fitness Apparel
  Fitness Tracking
  Bar Tools and Accessories
  Spirits and Liquors
  Mixers and Syrups
  Cocktail Kits
  Kitchen Appliances
  Cookware and Bakeware
  Knives and Cutting Tools
  Specialty Ingredients
  Baking Tools and Accessories
  Ingredients for Baking
  Baking Mixes
  Decorating Supplies
  Health Foods
  Fitness Supplements
  Vitamins & Minerals
  Hair Care Products
  Styling Tools
  Professional Hair Care
  Hair Color
  Nail Products
  Nail Care & Art
  Skincare Products
  Luxury Skincare
  Natural Skincare
  Acne Treatment
  Makeup Products
  Luxury Makeup
  Professional Makeup
  Organic Makeup
  Dog Food
  Dog Toys
  Dog Accessories
  Dog Health
  Cat Food
  Cat Toys
  Cat Accessories
  Cat Health
  Small Animal Supplies
  Fish and Aquarium Supplies
  Bird Supplies
  Reptile Supplies
  Binoculars and Scopes
  Bird Watching Supplies
  Wildlife Cameras
  Outdoor Gear
  Meditation Cushions
  Aromatherapy
  Mindfulness Journals
  Sleep Aids
  Mattresses
  Sleep Accessories
  Aromatherapy for Sleep
  Gardening Tools
  Outdoor Furniture
  Nature Journals
  Plant Care Products
  Essential Oils
  Diffusers
  Aromatherapy Accessories
  Natural Remedies
  Crafting Supplies
  DIY Home Improvement Tools
  Smart Home Devices and Automation
  Wearable Technology
  Mobile Device Accessories
  Computer and Networking Equipment
  Car Accessories & Maintenance Products
  Motorcycle Gear and Accessories
  Extreme Sports Equipment
  Indoor Recreation Equipment
  Winter Sports Gear
  Water Sports Equipment
  Outdoor Adventure Gear
  Sustainable Living Products
  Home Office Furniture and Accessories
  Ergonomic Workplace Solutions
  Pet Tech and Smart Products
  Personalized and Custom Gift Items
  Subscription Box Services
  Eco-Friendly Packaging Solutions
  Reusable & Sustainable House Products
  Learning Tools and Courses
  Home Security Systems
  Gourmet/Specialty Food Products
  Meal Kit/Recipe Subscription Services
  Artisanal and Handmade Goods
  Vintage/Retro-Inspired Products
  Upcycled and Repurposed Items
  Personal Safety Devices
  Indoor Gardening/Hydroponics
  Home Brewing & Fermentation Supplies
  Natural/Organic Beauty Products
  Men's Grooming Products
  Adaptive Clothing and Accessories
  Maternity and Nursing Products
  Baby and Toddler Gear
  Senior Living and Mobility Aids
  Home Organization & Storage Solutions
  Eco-Friendly Cleaning Products
  Air Purification Systems
  Water Filtration Products
  Healthy Snack Foods
  Specialty Food/Bev Dietary Products
  Home Spa and Relaxation Products
  Digital Detox and Wellness Products
  Productivity Tools and Planners
  Portable Charging Solutions
  Travel-Sized Products and Accessories
  Language Learning Tools
  Virtual and Augmented Reality Applications
  Electric Vehicle Accessories and Charging
  Micro-mobility Products
  Home Air Quality Monitoring Products
  Sustainable Packaging Alternatives
  Zero-waste Lifestyle Products
  Plant-based Protein Alternatives & Supplies
  Indoor Vertical Gardening Systems
  Personalized Nutrition & Supplement Kits
  At-home Diagnostic and Health Monitoring
  Adaptive Clothing for Aging & Disabled
  Modular Furniture for Small Spaces
  Remote Work Ergonomic Solutions
  Digital Nomad & Portable Office Gear
  Sustainable Fashion & Upcycled Clothing
  Sleep Optimization Products
  Mindfulness and Meditation Aids
  Eco-friendly Pet Products
  Sustainable Outdoor and Adventure Gear
  Home Energy Management Systems
  Water Conservation and Recycling Products
  Personalized Beauty and Skincare Systems
  Circular Economy Products 
  Functional Foods and Beverages
  Tech Wellness and Digital Detox
  Sustainable Home Cleaning
  3D Printing Supplies and Equipment
  Drone and RC Vehicle Equipment
  Tabletop Role-Playing Game Supplies
  Cosplay and Costume-Making Materials
  Vaping and E-cigarette Products
  Specialty Coffee and Tea Equipment
  Winemaking and Home Viticulture Supplies
  Astronomy and Stargazing Equipment
  Beekeeping Supplies
  Soap Making and Candle Making Kits
  Foraging and Wildcrafting Tools
  Taxidermy Supplies
  Terrarium and Vivarium Supplies
  Sensory Products for Neurodivergent Individuals
  Woodworking Tools and Supplies
  Metalworking and Blacksmithing Equipment
  Pottery and Ceramics Supplies
  Leatherworking Tools and Materials
  Accessibility and Adaptive Products
  Smart Home and IoT Devices
  Sustainable and Eco-Friendly Solutions
  Mental Health and Wellness Products
  Remote Work and Home Office Equipment
  Virtual and Augmented Reality Technology
  Customizable Gear & Accessories
  Outdoor Recreation and Adventure Gear
  Home Automation and Security Systems
  Digital Learning and Educational Technology
  Senior Care and Aging-in-Place Solutions
  Parenting and Baby Care Products
  Pet Care and Tech Products
  Sustainable Transportation Solutions
  Home Energy Management Systems
  Water Conservation and Purification Products
  Sustainable Fashion and Textiles
  Personal Safety and Emergency Preparedness
  Home Diagnostics and Health Monitoring
  Sustainable Packaging Solutions
  Plant-Based and Alternative Food Products
  Digital Content Creation Tools
  Wallets & Accessories
  Sustainable Agriculture and Gardening
  Artificial Intelligence and Machine Learning Products
  Biohacking and Human Enhancement Products
  Circular Economy and Upcycled Products
  Quantum Computing Hardware
  Blockchain and Cryptocurrency Hardware
  Space Exploration and Astronomy Equipment
  Vintage-inspired clothing
  Plus-size fashion
  Bohemian/Hippie chic
  Workwear and professional attire
  Outdoor/Adventure clothing
  Organic produce delivery
  Gourmet meal kits
  Specialty coffee roasters
  Craft beer clubs
  Artisanal cheese shops
  Vegan and plant-based foods
  Gluten-free bakeries
  Exotic fruit importers
  Premium tea merchants
  Grass-fed meat suppliers
  Sustainable seafood delivery
  International snack boxes
  Kombucha and fermented foods
  Nut butter specialists
  Spice and seasoning blends
  Olive oil and vinegar tasting clubs
  Gourmet chocolate makers
  Functional beverages (e.g., nootropics, adaptogens)
  Freeze-dried camping meals
  Local farm-to-table produce boxes
  Keto and low-carb food suppliers
  Wine subscription services
  Hot sauce and condiment specialists
  Protein powder and supplement retailers
  Cold-pressed juice cleanses
  It will never generate or use any market segments that are not included in this list. This will be displayed on its own line after the problem statement.
  
  Step 6: Identify Core Functionality, Feature, or Value Proposition:
  Look for statements that clearly explain what the product does, its main feature, or the primary benefit it offers.
  Identify Specific Customer Group or Audience:
  Look for mentions of a specific target market, customer demographic, or audience that the product is designed for.
  Identify Novelty:
  Look for descriptions of features, functionalities, or approaches that are unique, innovative, or not commonly seen in the current market.
  Scoring System:
  0 or 1 Characteristic:
  Output: Product Rating: 1
  2 Characteristics:
  Output: Product Rating: 5
  3 Characteristics:
  Output: Product Rating: 10
  Example User Inputs and Expected Outputs:
  For Example:
  "A natural ingredient shampoo for women in their 30s and 40s."
  The analysis would be:
  Core Feature: Yes (natural ingredient shampoo)
  Specific Customer Group: Yes (women in their 30s and 40s)
  Novelty: No (common feature)
  And the output should be: Product Rating: 5
  
  Step 7: Final Check: The assistant will double-check that the selected problem and market segment is from the lists provided earlier in this prompt. If the problem statement or market segment is not on the respective list, the assistant will revise the selection to use a problem or segment from the list that best fits the generated idea.
  
  Illustrative Examples
  Input: an emotions wheel toy for toddlers that helps them recognize and react to their emotions
  Output: {
    idea: "Emotions Wheel Toy for Toddlers",
    description: "A toy emotions wheel for toddlers that helps them recognize and respond to their emotions.",
    problem: "Screen time concerns for child development",
    market: "Educational Toys",
    productRating: 10
  }
  Input: backpack for skiers
  Output: {
    idea: "Backpack for Skiing",
    description: "A backpack designed for skiers.",
    problem: "Backpacks strain the shoulders",
    market: "Ski & Snowboard Accessories",
    productRating: 1
  }
  Input: High-fashion sports coats with trendy patterns & design made with Athleisure materials for young professionals 
  Output: {
    idea: "Trendy Sports Coats but Athleisure",
    description: "Trendy patterned sports coats made from athleisure materials, designed for young professionals seeking high fashion.",
    problem: "Work clothes are uncomfortable & fit poorly",
    market: "Workwear and professional attire",
    productRating: 10
  }
  Input: a gardening hose attachment for mixing water with plant nutrients
  Output: {
    idea: "Plant Nutrient Hose Attachment",
    description: "A gardening hose attachment that mixes water with plant nutrients.",
    problem: "Plants die from irregular watering",
    market: "Plant Care Products",
    productRating: 1
  }
  Input: caffeine-free tea brand focused on sourcing 100% natural and transparent ingredients to make a refreshing and pure cup of tea
  Output: {
    idea: "Natural, Caffeine-free Tea Brand",
    description: "A caffeine-free tea brand dedicated to sourcing 100% natural, transparent ingredients for a refreshing and pure cup of tea.",
    problem: "Food & beverage ingredients are toxic",
    market: "Premium tea merchants",
    productRating: 1
  }
  
  Additional Guidelines:
    Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
    Also, ensure that the problem and market should be selected from the given list and strictly do not recommend any other problem or market which is not available in the list
    Strictly ensure that you return only the required JSON parsable response and nothing else`,
  PRODUCT_RATING: `Objective:
  Evaluate a given business idea/concept by rating its product on three different criteria:
  Sophistication and Advanced Nature
  Novelty and Uniqueness
  Suitability for a Specific Group of Customers
  The scores assigned will be between 1 and 100, never rounded to 0 or 5, and should always be an exact number. The overall rating will be an average of the three criteria scores. 
  
  Note: Evaluate based solely on the provided description without assuming additional features or capabilities.
  
  Evaluation Criteria:
  
  Sophistication and Advanced Nature
  1-10: Basic, outdated technology, lacks complexity.
  Examples: Simple static websites, basic CRUD (Create, Read, Update, Delete) applications.
  Typical in: Legacy systems, basic informational websites.
  11-20: Slightly better than basic, minimal advancements.
  Examples: Basic responsive design, simple form-based web apps.
  Typical in: Entry-level web apps, minimal interactive features.
  21-30: Some advanced features, but mostly standard.
  Examples: Basic APIs, simple data integration.
  Typical in: Standard enterprise web applications, basic SaaS tools.
  31-40: Moderately sophisticated, includes some modern technology.
  Examples: Integrated cloud services, moderate use of JavaScript frameworks.
  Typical in: Modern CMS (Content Management Systems), basic e-commerce platforms.
  41-50: Fairly advanced, has noticeable improvements.
  Examples: Enhanced user interfaces, basic machine learning models.
  Typical in: High-quality mobile apps, advanced e-commerce platforms.
  51-60: Advanced, incorporates recent technology trends.
  Examples: Real-time data updates, advanced security features.
  Typical in: Modern SaaS platforms, advanced web applications.
  61-70: Highly sophisticated, uses cutting-edge technology.
  Examples: AI-powered features, complex data analytics.
  Typical in: Innovative mobile apps, high-tech web platforms.
  71-80: Very advanced, close to the latest innovations.
  Examples: Advanced machine learning models, real-time collaboration tools.
  Typical in: Top-tier productivity apps, sophisticated marketplace platforms.
  81-90: Extremely sophisticated, pushes technological boundaries.
  Examples: Advanced AI integration, state-of-the-art UX/UI.
  Typical in: Leading-edge fintech apps, innovative health tech platforms.
  91-100: Top-tier sophistication, leading-edge and pioneering.
  Examples: Quantum computing applications, pioneering AR/VR integration.
  Typical in: Cutting-edge research tools, next-gen technology startups.
  
  Novelty and Uniqueness
  1-10: Very common, no unique aspects.
  Examples: Basic to-do list apps, simple blog platforms.
  Typical in: Over-saturated markets, generic software solutions.
  11-20: Slightly uncommon, minor unique elements.
  Examples: Slight design tweaks, minor unique functionalities.
  Typical in: Basic apps with minor customizations, entry-level market variations.
  21-30: Some unique features, but largely similar to existing products.
  Examples: Unique branding, specific but minor feature enhancements.
  Typical in: Moderately differentiated SaaS tools, common marketplace platforms.
  31-40: Moderately unique, stands out in some aspects.
  Examples: Unique user interfaces, several distinct features.
  Typical in: Niche productivity apps, specialized content platforms.
  41-50: Fairly unique, distinct in several ways.
  Examples: Multiple innovative features, unique selling propositions.
  Typical in: Mid-range differentiated web apps, distinct service platforms.
  51-60: Unique, has multiple innovative elements.
  Examples: Patented algorithms, original service models.
  Typical in: High-end SaaS products, advanced market-specific platforms.
  61-70: Highly unique, noticeable differentiation.
  Examples: Breakthrough features, significantly different user experience.
  Typical in: Premium productivity tools, highly specialized service platforms.
  71-80: Very unique, rarely seen in the market.
  Examples: Novel technologies, market-disrupting innovations.
  Typical in: Emerging market apps, innovative B2B solutions.
  81-90: Extremely unique, groundbreaking.
  Examples: Revolutionary ideas, major industry shifts.
  Typical in: Top-tier innovative software, groundbreaking industry platforms.
  91-100: One-of-a-kind, highly innovative and original.
  Examples: First-of-its-kind technology, unprecedented market entries.
  Typical in: Market leaders, pioneering software products.
  
  Suitability for a Specific Group of Customers
  1-10: Generic, no specific target audience.
  Examples: Mass-market apps, no customization.
  Typical in: General consumer apps, undifferentiated web services.
  11-20: Vaguely defined audience, broad applicability.
  Examples: Basic segmentation, broad appeal.
  Typical in: General productivity tools, basic consumer apps.
  21-30: Somewhat targeted, but still general.
  Examples: Broad demographic targeting, general marketing strategies.
  Typical in: Widely applicable SaaS tools, broad enterprise solutions.
  31-40: Moderately targeted, identifiable audience.
  Examples: Specific age groups, general industry applications.
  Typical in: Targeted consumer apps, industry-specific software.
  41-50: Fairly targeted, clear customer segment.
  Examples: Well-defined demographics, focused marketing.
  Typical in: Mid-market enterprise tools, specialized consumer apps.
  51-60: Well-targeted, specific customer base.
  Examples: Niche market segments, specific business sectors.
  Typical in: Premium SaaS products, targeted industry solutions.
  61-70: Highly targeted, well-defined niche market.
  Examples: Highly specific customer needs, specialized industries.
  Typical in: High-end niche apps, bespoke enterprise solutions.
  71-80: Very targeted, strong focus on a particular group.
  Examples: Highly specialized demographics, unique market needs.
  Typical in: Ultra-niche productivity tools, highly specialized B2B platforms.
  81-90: Extremely targeted, highly specialized audience.
  Examples: Very specific customer profiles, unique market segments.
  Typical in: Top-tier niche markets, exclusive SaaS products.
  91-100: Perfectly targeted, exceptionally well-suited for a specific group.
  Examples: Custom-built solutions, perfectly matched to customer needs.
  Typical in: Ultra-premium software products, bespoke industry platforms.
  
  Output Format (Your response should be a JSON object in given output format only, without any other description or statements):
  {
    "Sophistication Score": [Exact Score],
    "sophisticationDescription": One sentence description of the score.,
    "Unique Score": [Exact Score],
    "uniqueScoreDescription": One sentence description of the score.,
    "Audience Focus Score": [Exact Score],
    "audienceFocusScoreDescription": One sentence description of the score.,
    "Overall Score": [Average of the three scores]
  }
  
  Note: Only consider explicitly mentioned advancements or features.
  
  Illustrative Examples:
  Input:
  a fitness app that curates personalized workouts for users based on their preferences
  Output: {
    "Sophistication Score": 33,
    "sophisticationDescription": "As a standard mobile application with personalization features, the offering uses basic mobile app technology and architecture.",
    "Unique Score": 24,
    "uniqueScoreDescription": "Personalization in fitness apps is slightly unique but not groundbreaking.",
    "Audience Focus Score": 41,
    "audienceFocusScoreDescription": "The app targets fitness enthusiasts looking for personalized workout plans, which is a broad but identifiable customer base.",
    "Overall Score": 33
  }
  
  Input:
  A browser extension that detects the sports game you're streaming and suggests relevant live bets based on real-time game analytics
  Output: {
    "Sophistication Score": 73,
    "sophisticationDescription": "The extension uses advanced technology, including real-time game detection and analytics, which is close to the latest innovations.",
    "Unique Score": 64,
    "uniqueScoreDescription": "Suggesting live bets based on real-time game analytics is highly unique and noticeably different in the market.",
    "Audience Focus Score": 76,
    "audienceFocusScoreDescription": "This extension is very targeted towards sports enthusiasts who engage in live betting, addressing a highly specialized audience.",
    "Overall Score": 71
  }

  Input:
  A platform that allows parents to upload a sample of their voice and picture that AI turns into a child YouTube video, so it feels like they are the star of the video and teaching their own children
  Output: {
    "Sophistication Score": 83,
    "sophisticationDescription": "The platform uses extremely sophisticated AI for personalized video creation, pushing the boundaries of current AI capabilities.",
    "Unique Score": 94,
    "uniqueScoreDescription": "The concept is extremely unique and groundbreaking, offering highly personalized educational content for children.",
    "Audience Focus Score": 89,
    "audienceFocusScoreDescription": "The platform is exceptionally well-suited for parents wanting to create personalized educational content for their children, making it highly targeted.",
    "Overall Score": 89
  }
  Additional Guidelines:
  Before returning the response, strictly ensure and verify that the response structure should strictly be in such a way that it can be parsed to JSON using JSON.parse()
  Strictly ensure that you return only the required JSON parsable response and nothing else`,
};
