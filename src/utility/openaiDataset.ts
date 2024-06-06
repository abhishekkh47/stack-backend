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
    Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'description' key containg the generated catchy short description, 'idea' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input:
    Finding eco-friendly children's toys
    Output:
    {
      "description": "Eco-friendly Children's Blocks",
      "idea": "Modular, eco-friendly building blocks made from recycled materials with interlocking mechanisms for enhanced stability and creativity.",
      "segment": "Educational Toys"
    }
    Input:
    Finding luxury sleepwear
    Output:
    {
      "description": "Temperature-Regulating Luxury Sleepwear",
      "idea": "Temperature-regulating luxury sleepwear with advanced fabric technology for optimal comfort and sleep quality.",
      "segment": "Luxury Clothing"
    }
    Input:
    Home Cooking. Organizing Kitchen Tools and Supplies
    Output:
    {
      "description": "Modular Space-Saving Cookware",
      "idea": "Smart, modular cookware set with interchangeable handles and lids, featuring space-saving stackable design for efficient storage and cooking.",
      "segment": "Kitchen Appliances"
    }
    Input:
    Health & Nutrition. Creating a supplement plan
    Output:
    {
      "description": "DNA-personalized Nutrition Supplements",
      "idea": "Personalized fitness supplements with DNA-based formulations for optimal nutrient absorption and performance enhancement.",
      "segment": "Fitness Supplements"
    }
    Input:
    Taking care of indoor plants
    Output:
    {
      "description": "Smart Plant Care System",
      "idea": "Smart plant care system with AI-driven watering, lighting, and nutrient dosing for optimal plant health and growth.",
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
    Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'description' key containg the generated catchy short description, 'idea' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Finding affordable and convenient tennis lessons
    Output: 
    {
        "description": "AI tennis coach racket",
        "idea": "AI-powered tennis racket with real-time swing analysis and personalized coaching for skill improvement.",
        "segment": "Tennis Equipment"
    }
    Input: 
    A more personalized concert experience
    Output: 
    {
        "description": "AR interactive concert glasses",
        "idea": "Augmented reality concert glasses with real-time lyrics, artist info, and interactive visuals for enhanced experiences.",
        "segment": "Concert Accessories"
    }
    Input: 
    Repetitive board game content
    Output:
    {
        "description": "User-generated modular board game",
        "idea": "Collaborative board game with modular, user-generated content for endless replayability and creativity.",
        "segment": "Board Games"
    }
    Input: 
    Home gym. Maximizing Limited Space
    Output:
    {
        "description": "VR compact home gym",
        "idea": "Portable, compact home gym equipment with virtual reality integration for immersive, space-saving workouts.",
        "segment": "Home Gym Equipment"
    }
    Input: 
    Wildlife Observation & Care. Integrating Habitats and Feeders with Environmental Monitoring
    Output:
    {
        "description": "Eco-friendly smart bird feeder",
        "idea": "Eco-friendly, noise-canceling bird feeder with built-in camera for remote bird watching and conservation.",
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
    Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'description' key containg the generated catchy short description, 'idea' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Phone battery dies during long group hangouts
    Output: 
    {
        "description": "Solar-charging beach umbrella",
        "idea": "Customizable, modular beach umbrella with built-in sand anchors and solar-powered phone charger.",
        "segment": "Beach Gear"
    }
    Input: 
    Holidays, Birthdays & Traditions. Finding fun and unique decorations or party accessories
    Output:
    {
        "description": "Eco-friendly plantable party confetti",
        "idea": "Eco-friendly, biodegradable confetti and streamers made from plantable seed paper for sustainable celebrations.",
        "segment": "Party Supplies"
    } 
    Input: 
    Inconsistent golf grip and comfort
    Output:
    {
        "description": "Adjustable grip-enhancing golf glove",
        "idea": "Golf glove with built-in grip enhancers and adjustable tension for improved comfort and swing consistency.",
        "segment": "Golf Apparel"
    } 
    Input: 
    Affording rare coins
    Output:
    {
        "description": "Collectible mystery coin sets",
        "idea": "Collectible, mystery coin sets with themed packaging and varying rarity levels for exciting, accessible collecting.",
        "segment": "Coin Collecting Supplies"
    } 
    Input: 
    Staying hygienic during culinary adventures
    Output:
    {
        "description": "Self-sanitizing portable travel utensils",
        "idea": "Portable, compact travel utensil set with built-in sanitizing case for hygienic, on-the-go dining.",
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
    Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'description' key containg the generated catchy short description, 'idea' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Educating a toddler without cringe youtube videos
    Output: 
    {
      "description": "JibJab for Educational Kids' Music Videos",
      "idea": "Parents upload a voice recording and picture to create educational music videos, like popular YouTube kids' channels, featuring them as the performer.",
      "segment": "Music Learning Apps"
    }
    Input: 
    Sports/Fitness. Finding available exercise equipment at the gym
    Output:
    {
      "description": "OpenTable for Smart Gym Equipment Bookings",
      "idea": "An app that integrates with gym equipment to reserve machines and optimize workout plans based on real-time availability and user goals.",
      "segment": "Fitness and Training Apps"
    } 
    Input: 
    Getting unfairly banned by game moderators
    Output:
    {
      "description": "Reddit for Decentralized Game Moderation",
      "idea": "A decentralized moderation system where the community votes on content and behavior moderation, ensuring fair and transparent enforcement.",
      "segment": "Blockchain Gaming Platforms"
    } 
    Input: 
    Fantasy Sports. Sparking more interaction in fantasy league SMS threads
    Output:
    {
      "description": "WhatsApp for Fantasy Recaps",
      "idea": "An integration that sends weekly fantasy recaps to group chats/SMS threads, sparking fun league conversations with data-driven insights.",
      "segment": "Fantasy Sports Platforms"
    } 
    Input: 
    Photography. Making photo editing easier
    Output:
    {
      "description": "Siri for Voice-Controlled Photo Editing",
      "idea": "An app that allows users to apply photo edits and effects using voice commands, making the editing process more accessible.",
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
    Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'description' key containg the generated catchy short description, 'idea' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input:
    Jobs/Careers. Preparing for a career switch
    Output:
    {
      "description": "Roblox for Career Exploration",
      "idea": "A mobile app that allows users to virtually explore careers, learn required skills, complete simulated tasks, and build a professional portfolio.",
      "segment": "Educational Apps and Game Platforms"
    }
    Input:
    Sports/Fitness. Finding available exercise equipment at the gym
    Output:
    {
      "description": "OpenTable for Smart Gym Equipment Bookings",
      "idea": "An app that integrates with gym equipment to reserve machines and optimize workout plans based on real-time availability and user goals.",
      "segment": "Fitness and Training Apps"
    }
    Input:
    Finding music to pair with edited videos or other content
    Output:
    {
      "description": "Spotify for Storytelling",
      "idea": "A platform that generates dynamic soundtracks for stories and narratives, with AI adapting the music to fit the plot twists, character emotions, and scenes.",
      "segment": "AI Music Composition Tools"
    }
    Input:
    Gaming. Lack of true ownership in gaming
    Output:
    {
      "description": "Minecraft for Blockchain",
      "idea": "A sandbox game where players can build, own, and trade virtual lands and assets using blockchain, with in-game items having real-world value through NFTs.",
      "segment": "Blockchain Gaming Platforms"
    }
    Input:
    Finance/Investing. Creating a balanced and diversified investment portfolio
    Output:
    {
      "description": "Hedgeye for AI-Driven Hedging Strategies",
      "idea": "A platform that uses AI to develop and execute hedging strategies, protecting portfolios from downside risk.",
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
    Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'description' key containg the generated catchy short description, 'idea' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Music. Developing songwriting skills
    Output:
    {
      "description": "Grammarly for Songwriting",
      "idea": "An app that provides songwriting prompts, tools, and feedback, helping users develop their songwriting abilities and create original music.",
      "segment": "Music Learning Apps"
    } 
    Input: 
    Mental Health. Finding moments of relaxation
    Output:
    {
      "description": "Calm for Photo Therapy",
      "idea": "A mobile app that combines mindfulness exercises with photo editing tasks to promote relaxation, creativity, and mental well-being.",
      "segment": "Photo Editing Mobile Apps"
    } 
    Input: 
    Staying in touch with friends virtually
    Output:
    {
      "description": "WhatsApp for Automated Photo Book Sharing",
      "idea": "An app that automatically creates and shares photo book memories with friends and family via group texts on special occasions and anniversaries.",
      "segment": "Photo Book Creation Software"
    } 
    Input: 
    Sports/Fitness. Fitting workouts into a busy daily routine
    Output:
    {
      "description": "HIIT for Micro-Workouts",
      "idea": "An app offering 5-10 minute micro-workouts tailored to specific fitness goals and schedules, fitting seamlessly into daily routines.",
      "segment": "Fitness and Training Apps"
    } 
    Input: 
    Watching Sports. Staying engaged during live sporting events
    Output:
    {
      "description": "Twitter for Real-Time Fan Polls",
      "idea": "An app that conducts real-time polls during games and events, allowing fans to vote on various aspects like player of the match, game strategies, and more.",
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
    Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'description' key containg the generated catchy short description, 'idea' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Educating a toddler without cringe youtube videos
    Output: 
    {
      "description": "JibJab for Educational Kids' Music Videos",
      "idea": "Parents upload a voice recording and picture to create educational music videos, like popular YouTube kids' channels, featuring them as the performer.",
      "segment": "Music Learning Apps"
    }
    Input: 
    Sports/Fitness. Finding available exercise equipment at the gym
    Output:
    {
      "description": "OpenTable for Smart Gym Equipment Bookings",
      "idea": "An app that integrates with gym equipment to reserve machines and optimize workout plans based on real-time availability and user goals.",
      "segment": "Fitness and Training Apps"
    } 
    Input: 
    Getting unfairly banned by game moderators
    Output:
    {
      "description": "Reddit for Decentralized Game Moderation",
      "idea": "A decentralized moderation system where the community votes on content and behavior moderation, ensuring fair and transparent enforcement.",
      "segment": "Blockchain Gaming Platforms"
    } 
    Input: 
    Fantasy Sports. Sparking more interaction in fantasy league SMS threads
    Output:
    {
      "description": "WhatsApp for Fantasy Recaps",
      "idea": "An integration that sends weekly fantasy recaps to group chats/SMS threads, sparking fun league conversations with data-driven insights.",
      "segment": "Fantasy Sports Platforms"
    } 
    Input: 
    Photography. Making photo editing easier
    Output:
    {
      "description": "Siri for Voice-Controlled Photo Editing",
      "idea": "An app that allows users to apply photo edits and effects using voice commands, making the editing process more accessible.",
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
    Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'description' key containg the generated catchy short description, 'idea' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input:
    Jobs/Careers. Preparing for a career switch
    Output:
    {
      "description": "Roblox for Career Exploration",
      "idea": "A mobile app that allows users to virtually explore careers, learn required skills, complete simulated tasks, and build a professional portfolio.",
      "segment": "Educational Apps and Game Platforms"
    }
    Input:
    Sports/Fitness. Finding available exercise equipment at the gym
    Output:
    {
      "description": "OpenTable for Smart Gym Equipment Bookings",
      "idea": "An app that integrates with gym equipment to reserve machines and optimize workout plans based on real-time availability and user goals.",
      "segment": "Fitness and Training Apps"
    }
    Input:
    Finding music to pair with edited videos or other content
    Output:
    {
      "description": "Spotify for Storytelling",
      "idea": "A platform that generates dynamic soundtracks for stories and narratives, with AI adapting the music to fit the plot twists, character emotions, and scenes.",
      "segment": "AI Music Composition Tools"
    }
    Input:
    Gaming. Lack of true ownership in gaming
    Output:
    {
      "description": "Minecraft for Blockchain",
      "idea": "A sandbox game where players can build, own, and trade virtual lands and assets using blockchain, with in-game items having real-world value through NFTs.",
      "segment": "Blockchain Gaming Platforms"
    }
    Input:
    Finance/Investing. Creating a balanced and diversified investment portfolio
    Output:
    {
      "description": "Hedgeye for AI-Driven Hedging Strategies",
      "idea": "A platform that uses AI to develop and execute hedging strategies, protecting portfolios from downside risk.",
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
    Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
    You should also ensure that the respone should be an strictly be an object having 'description' key containg the generated catchy short description, 'idea' key containing the generated business idea and 'segment' key containing the chosen Market Segment.
    You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea' and 'segment'. Nothing else will be considered a valid response.
    To illustrate, here are 5 diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
    Input: 
    Music. Developing songwriting skills
    Output:
    {
      "description": "Grammarly for Songwriting",
      "idea": "An app that provides songwriting prompts, tools, and feedback, helping users develop their songwriting abilities and create original music.",
      "segment": "Music Learning Apps"
    } 
    Input: 
    Mental Health. Finding moments of relaxation
    Output:
    {
      "description": "Calm for Photo Therapy",
      "idea": "A mobile app that combines mindfulness exercises with photo editing tasks to promote relaxation, creativity, and mental well-being.",
      "segment": "Photo Editing Mobile Apps"
    } 
    Input: 
    Staying in touch with friends virtually
    Output:
    {
      "description": "WhatsApp for Automated Photo Book Sharing",
      "idea": "An app that automatically creates and shares photo book memories with friends and family via group texts on special occasions and anniversaries.",
      "segment": "Photo Book Creation Software"
    } 
    Input: 
    Sports/Fitness. Fitting workouts into a busy daily routine
    Output:
    {
      "description": "HIIT for Micro-Workouts",
      "idea": "An app offering 5-10 minute micro-workouts tailored to specific fitness goals and schedules, fitting seamlessly into daily routines.",
      "segment": "Fitness and Training Apps"
    } 
    Input: 
    Watching Sports. Staying engaged during live sporting events
    Output:
    {
      "description": "Twitter for Real-Time Fan Polls",
      "idea": "An app that conducts real-time polls during games and events, allowing fans to vote on various aspects like player of the match, game strategies, and more.",
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
  Also, ensure that your response should only contain three things that is business description, business idea and the market segment based on the requirements provided above. Strictly refrain from providing anything which is not asked in the above requirement.
  You should also ensure that the respone should strictly be an object having 'description' key containing the generated catchy short description, 'idea' key containing the generated business idea, 'segment' key containing the chosen Market Segment and 'type' containing the type of business idea, whether it is 'software' or 'physical'.
  You can cross-check the response structure from some of the examples given below. And the response object should strictly contain only three key-value pairs, where keys should be 'description', 'idea', 'segment' and 'type'. Nothing else will be considered a valid response.
  To illustrate, here are some diverse examples that demonstrate the desired output format and cover different niches, user problems, and innovative approaches:
  Example Outputs
  Input: a smart bird feeder with a built in camera for noise conscious, remote bird watching 
  Output:
  {
      "description": "Smart Bird Feeder",
      "idea": "Noise-cancelling bird feeder with built-in camera for remote bird watching and conservation.",
      "segment": "Bird Watching Supplies",
      "type": "product"
  }
  Input: ai integrated tennis racket that provides real swing analysis and coaching suggestions for improvement. 
  Output:
  {
      "description": "AI Tennis Coach Racket",
      "idea": "AI-powered tennis racket with real-time swing analysis and personalized coaching for skill improvement.",
      "segment": "Tennis Equipment",
      "type": "product"
  }
  Input: beach umbrella with built in anchoring system and a solar powered phone charger 
  Output:
  {
      "description": "Solar-charging beach umbrella",
      "idea": "Customizable, modular beach umbrella with built-in sand anchors and solar-powered phone charger.",
      "segment": "Beach Gear",
      "type": "product"
  }
  Input: coin collecting sets with themed packaging and rarity levels similar to trading card packs. 
  Output:
  {
      "description": "Collectible mystery coin sets",
      "idea": "Collectible, mystery coin sets with themed packaging and varying rarity levels for exciting, accessible collecting.",
      "segment": "Coin Collecting Supplies",
      "type": "product"
  }
  Input: smart plant care system where ai optimizes watering and lighting for plant growth 
  Output:
  {
      "description": "Smart Plant Care System",
      "idea": "Smart plant care system with AI-driven watering, lighting, and nutrient dosing for optimal plant health and growth.",
      "segment": "Plant Care Products",
      "type": "product"
  }
  Input: workout app focused on 5 minute workouts that fit into your daily life. 
  Output:
  {
      "description": "5-Minute P90X Mobile App",
      "idea": "An app offering 5-10 minute micro-workouts tailored to specific fitness goals and schedules, fitting seamlessly into daily routines.",
      "segment": "Fitness and Training Apps",
      "type": "software"
  }
  Input: a live voting app where fans get to influence real game decisions and nominate players of the game. 
  Output:
  {
      "description": "Twitter for Real-Time Fan Polls",
      "idea": "An app that conducts real-time polls during games and events, allowing fans to vote on various aspects like player of the match, game strategies, and more.",
      "segment": "Fan Engagement and Loyalty Platforms",
      "type": "software"
  }
  Input: an app that send pictures of moments and memories to a group chat of friends for birthdays, event anniversaries, etc. 
  Output:
  {
      "description": "Instagram on SMS",
      "idea": "An app that automatically creates and shares photo book memories with friends and family via group texts on special occasions and anniversaries.",
      "segment": "Photo Book Creation Software",
      "type": "software"
  }
  Input: an app that helps songwriters create and get feedback on their work using AI 
  Output:
  {
      "description": "Grammarly for Songwriting",
      "idea": "An app that provides songwriting prompts, tools, and feedback, helping users develop their songwriting abilities and create original music.",
      "segment": "Music Learning Apps",
      "type": "software"
  }
  Input: platform that allows parents to upload a sample of their voice and picture that AI turns into a child youtube video, so it feels like they are the star of the video and teaching their own children. 
  Output: 
  {
      "description": "JibJab for Educational Kids' Music Videos",
      "idea": "Parents upload a voice recording and picture to create educational music videos, like popular YouTube kids' channels, featuring them as the performer.",
      "segment": "Music Learning Apps",
      "type": "software"
  }`,
};
