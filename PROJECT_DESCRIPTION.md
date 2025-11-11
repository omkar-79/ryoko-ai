# Ryoko AI Trip Planner

## Inspiration

Planning group trips is a nightmare. Endless group chats, conflicting preferences, scattered research across multiple websites, and someone always ends up disappointed. We wanted to solve this pain point by creating an AI-powered platform that makes group trip planning collaborative, fun, and effortless.

The name "Ryoko" means "travel" in Japanese, reflecting our vision of making travel planning as smooth and thoughtful as Japanese design principles.

## What it does

Ryoko AI is an intelligent group trip planner that creates personalized, detailed itineraries by combining everyone's preferences into one cohesive plan.

**Key Features:**
- **Easy Group Collaboration**: Plan creators invite team members with simple invite codes—no email or phone required
- **Preference Aggregation**: Automatically combines budgets, interests, must-do items, and veto items from all members into a unified group profile
- **AI-Powered Itineraries**: Uses Google Gemini API with Google Maps Grounding to generate day-by-day plans with real location data, official place names, and accurate Google Maps URIs
- **Rich Visual Experience**: Displays actual place photos from Google Maps, interactive location details, and expandable activity cards
- **Smart Location Data**: Integrates Google Maps Grounding to ensure all places have verified locations, photos, and direct map links
- **Real-time Updates**: Plan dashboard updates live as members join and preferences change

**User Flow:**
1. Creator registers and creates a new trip plan
2. Shares invite code with group members
3. Members join using the code and set a passcode for future access
4. Each member adds their preferences (budget, interests, must-dos, vetos)
5. Creator generates AI itinerary based on aggregated group preferences
6. Everyone can view and explore the detailed plan with maps and photos

## How we built it

We're a team of 4 developers who divided the work strategically:

**Teammate 1 - Prototype & AI Integration:**
- Used Google AI Studio to create and test the initial prototype
- Integrated Google Gemini API with Google Maps and Google Search Grounding
- Designed the prompt engineering to ensure AI uses actual URIs from grounding metadata
- Implemented retry logic and error handling for API calls

**Teammate 2 - Firebase Setup & Backend:**
- Set up Firebase project with Firestore and Authentication
- Designed database schema for users, plans, and members
- Implemented security rules for mixed authentication (authenticated creators + unauthenticated members)
- Built Firebase services for plan CRUD, member management, and real-time subscriptions
- Created passcode-based authentication system for team members

**Teammate 3 - Google Cloud Run Deployment:**
- Created Dockerfile with multi-stage build (Node.js build + nginx serve)
- Configured nginx for SPA routing and static asset optimization
- Set up Cloud Build pipeline with environment variable handling
- Deployed to Google Cloud Run with proper IAM permissions
- Automated deployment script for easy updates

**Teammate 4 - Testing & UX Refinement:**
- Conducted end-to-end testing of all user flows
- Tested Firebase security rules and permission scenarios
- Verified Google Maps integration and photo loading
- Refined UI/UX for travel-friendly, Gen Z aesthetic
- Fixed bugs and edge cases throughout development

**Tech Stack:**
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Firebase (Firestore, Authentication)
- **AI**: Google Gemini 2.5 Pro with Google Maps & Search Grounding
- **Maps**: Google Maps JavaScript API, Places API, Static Maps API
- **Deployment**: Docker, nginx, Google Cloud Run
- **Authentication**: Firebase Auth + custom passcode system

## Challenges we ran into

1. **Google Maps Grounding URI Extraction**
   - **Problem**: Initially, the AI was generating fake Google Maps URLs instead of using actual URIs from grounding metadata
   - **Solution**: Refined prompt engineering with explicit instructions to extract URIs from grounding metadata, added verification logging, and implemented fallback matching from grounding chunks

2. **Firebase Security Rules for Mixed Authentication**
   - **Problem**: Needed to allow authenticated creators full access while enabling unauthenticated members to join and update preferences
   - **Solution**: Designed granular security rules allowing members to read plans/members and update only aggregated preference fields, with validation to prevent unauthorized changes

3. **Environment Variables in Cloud Run Build**
   - **Problem**: Vite requires environment variables at build time, not runtime, making Cloud Run deployment tricky
   - **Solution**: Used Docker build arguments to pass environment variables during the build stage, ensuring all `VITE_*` variables are embedded in the static build

4. **SPA Routing with nginx**
   - **Problem**: React Router routes weren't working after deployment because nginx didn't know to serve index.html for all routes
   - **Solution**: Configured nginx with `try_files` directive to fallback to index.html for all routes, enabling client-side routing

5. **Real-time Preference Aggregation**
   - **Problem**: When new members joined, their preferences weren't immediately reflected in the aggregated plan data
   - **Solution**: Implemented explicit aggregation in member creation, made updates non-blocking, and used Firestore real-time listeners for instant UI updates

6. **Google Maps API Loading Race Conditions**
   - **Problem**: Geocoding functions were called before Google Maps JavaScript API finished loading
   - **Solution**: Created centralized `loadGoogleMapsAPI` utility that ensures API is loaded before use, with promise-based loading and proper error handling

## Accomplishments that we're proud of

✅ **Seamless Group Collaboration**: Created a frictionless experience where anyone can join a plan with just an invite code and passcode—no account creation required for team members

✅ **Real Location Data Integration**: Successfully integrated Google Maps Grounding to ensure every place in the itinerary has verified location data, photos, and accurate map links

✅ **Beautiful, Travel-Friendly UI**: Designed a modern, Gen Z-friendly interface with travel doodles, light gradients, and intuitive expandable cards that make trip planning exciting

✅ **Robust Error Handling**: Implemented comprehensive error handling with exponential backoff retries for API calls, graceful fallbacks for missing data, and user-friendly error messages

✅ **Production-Ready Deployment**: Successfully deployed to Google Cloud Run with automated CI/CD, proper security configurations, and optimized performance

✅ **Real-time Synchronization**: Built a real-time system where plan updates, member joins, and preference changes are instantly reflected across all users

✅ **Smart Preference Aggregation**: Created an intelligent system that combines diverse member preferences into coherent group profiles that the AI can effectively use

## What we learned

- **Google Maps Grounding**: Learned how to properly use Google Maps Grounding with Gemini API to get real, verified location data instead of hallucinated URLs

- **Firebase Security Patterns**: Gained deep understanding of Firestore security rules, especially for scenarios with mixed authentication models

- **Docker Multi-stage Builds**: Mastered efficient Docker builds that separate build dependencies from runtime, resulting in smaller, faster containers

- **Vite Environment Variables**: Understood the difference between build-time and runtime environment variables, and how to properly handle them in containerized deployments

- **Google Cloud Run Best Practices**: Learned about IAM permissions, port configuration, health checks, and proper nginx setup for Cloud Run

- **Prompt Engineering**: Discovered the importance of explicit, structured prompts when working with AI APIs to ensure consistent, accurate outputs

- **Real-time Data Architecture**: Gained experience designing real-time systems with Firestore listeners and managing state synchronization across multiple users

## What's next for RyokoAI

🚀 **Short-term Improvements:**
- Add ability to edit generated itineraries (add/remove activities, adjust times)
- Implement plan sharing via social media links
- Add trip budget tracking and expense splitting features
- Create mobile app versions (iOS/Android)

🌍 **Medium-term Features:**
- Multi-destination trip planning
- Integration with booking platforms (hotels, flights, activities)
- AI-powered travel recommendations based on weather, events, and local insights
- Collaborative voting system for activity preferences
- Export itineraries to PDF/Google Calendar

🤖 **AI Enhancements:**
- Fine-tune prompts for better personalization based on group dynamics
- Add support for dietary restrictions and accessibility needs
- Implement smart scheduling that considers travel time between locations
- Generate alternative itinerary options for the same trip

🔐 **Technical Improvements:**
- Move Gemini API calls to backend service for better security
- Implement rate limiting and caching for API calls
- Add analytics dashboard for plan creators
- Support for multiple languages and currencies

💡 **Community Features:**
- Public itinerary library where users can browse and remix popular trips
- User reviews and ratings for places in itineraries
- Social features: follow other travelers, share trip highlights
- Integration with travel communities and forums

---

**Live Demo**: [https://ryoko-ai-trip-planner-upoylsikiq-uc.a.run.app](https://ryoko-ai-trip-planner-upoylsikiq-uc.a.run.app)

**Built with**: React • TypeScript • Firebase • Google Gemini API • Google Maps • Google Cloud Run

