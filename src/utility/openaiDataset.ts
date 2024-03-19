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
  
  Instruction for Enhanced Precision: Ensure the output is formatted to exclusively include the company names within an array, adhering to the detailed criteria provided. The output must not contain the business description or any additional explanatory text.`,

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
      
  Instruction for Enhanced Precision: Ensure the output is formatted to exclusively include the X for Y within an array, adhering to the detailed criteria provided. The output must not contain the business description or any additional explanatory text.`,

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

  CALL_TO_ACTION: `"Based on the business description provided in the user prompt, I want you to provide 4 call-to-action strings of 2-4 words regarding that business. The response should be only an array containing four call-to-action strings as provided in below illustrative examples:

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
};
