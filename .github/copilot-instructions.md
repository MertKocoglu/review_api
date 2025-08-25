<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Google Play Review API - Copilot Instructions

This is a Node.js Express API project for scraping Google Play Store app reviews.

## Project Structure
- TypeScript with Express.js framework
- Google Play scraper for review data extraction
- RESTful API design
- Proper error handling and validation

## Key Technologies
- **Express.js**: Web framework for Node.js
- **TypeScript**: Type-safe JavaScript
- **google-play-scraper**: Library for scraping Google Play Store data
- **CORS, Helmet, Morgan**: Security and logging middleware

## API Endpoints
- `GET /api/reviews/:appId` - Get reviews for a specific app
- `GET /api/reviews/:appId/info` - Get detailed app information  
- `GET /api/reviews/search` - Search for apps in Google Play Store
- `GET /health` - Health check endpoint

## Code Style Guidelines
- Use TypeScript interfaces for type safety
- Implement proper error handling with try-catch blocks
- Follow RESTful API conventions
- Include comprehensive input validation
- Use descriptive variable and function names
- Add JSDoc comments for public methods

## Security Considerations
- Rate limiting should be implemented for production
- Input sanitization and validation
- Proper error messages without exposing internal details
- CORS configuration for allowed origins
