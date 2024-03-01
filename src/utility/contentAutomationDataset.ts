"use strict";
export const IMAGE_GENERATION_PROMPTS = {
  GPT_MODEL: "gpt-3.5-turbo",
  STORY_MAIN_IMAGES: `Craft 12 concise visual descriptions for each story phrase provided in user prompt, focus on the essential elements such as the character's key visual features, the setting, and the mood or action. These stories are non-fictional so be sure to research the actual features and details of the setting based on facts. You will then add the following quotation to each short description: "", in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4"". I have also provided an illustrative example below.
  
    Story phases examples:
    Story Phrase 1: In 1992, Travis and Dane, “the Dutch Bros,” faced a challenge: creating a unique coffee experience in a saturated market.
    Story Phrase 2: Noticing McDonald's drive-thru lacked specialty coffee, they saw an opportunity to offer something different.
    Story Phrase 3: They realized people wanted more than just regular coffee – they loved specialty coffee products with bold, rich flavors.
    Story Phrase 4: The brothers confirmed the desire for specialty coffee products by handing out espressos in a grocery store parking lot. 
    Story Phrase 5: Observing the opportunity for scalable distribution, they looked to the leading specialty coffee provider, Starbucks.
    Story Phrase 6: They quickly realized Starbuck’s lacked the convenience of drive-thru locations. 
    Story Phrase 7: The brothers built a custom trailer, specifically designed for drive-thru coffee, which quickly gained popularity.
    Story Phrase 8: One of their best customers, impressed by the concept, proposed franchising a new location in a nearby city.
    Story Phrase 9: Seeing the success of the McDonald’s franchise, the future of scalability became clear.
    Story Phrase 10: Embracing this opportunity, Dutch Bros expanded through franchising and the business started to take off. 
    Story Phrase 11: As the number of locations started to grow, the brothers expanded the drink menu to rival that of Starbucks. 
    Story Phrase 12: Dutch Bros is now one of the largest coffee chains in the U.S., with hundreds of locations nationwide.
    
    Output example & format:
    ["two friendly bearded caucasian male business owners dressed in casual clothes and holding coffee cups, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "cars in line next to McDonalds restaurant, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "artisanal cup of coffee in brightly colored mug, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "friendly bearded caucasian male handing cup of espresso to old lady in grocery store parking lot, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "starbucks palace, huge building, starbucks logo, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "long line of customers at starbucks coffee shop, busy, chaotic, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "coffee truck, friendly bearded barista in coffee shop window, customers in line, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "two ""Dutch Bros Coffee"" logos on map, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "map of united states with McDonalds logo's in many places, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "two friendly bearded caucasian male business owners laying on a pile of coffee cups, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "coffee shop with big menu, many menu items, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4",
    "coffee cup made of gold with the words "Dutch Bros" etched into it, in the style of photo-realistic, soft lighting, studio photography --v 6.0 --ar 3:4"]`,

  STORY_MC_AND_QUIZ_IMAGES: `Provide a 1-5 word visual description of a distinct, simple object that vividly represents the description from user prompt. The object should be something that can be rendered in a simple yet captivating manner in a logo design. Replace OBJECT with the chosen object in the following format: 'vector logo of OBJECT, vibrant colors, black background --v 6.0'. Avoid generic or abstract concepts in favor of concrete and visually stimulating elements.
  
    Strictly, provide only the output without quotations or an explanation in your response.
    
    Illustrative examples:
    
    Example 1
    Description: an investing app
    Object: bag of money
    Output: vector logo of bag of money, vibrant colors, black background --v 6.0
    
    Example 2
    Description: Market to fit users
    Object: strong arm
    Output: vector logo of strong arm, vibrant colors, black background --v 6.0
    
    Example 3
    Business description: run paid ads
    Object: megaphone
    Output: vector logo of megaphone, vibrant colors, black background --v 6.0
  
    Output Format Expectation:
    Ensure the response is a single string if the generated visual description as instructed, strictly adhering to the criteria provided. The output should look similar to this template, omitting any explanations:
    'vector logo of megaphone, vibrant colors, black background --v 6.0'
    
    Instruction for Enhanced Precision: Ensure the output is formatted exclusively, adhering to the detailed criteria provided. The output must not contain the business description or any additional explanatory text.`,
};
